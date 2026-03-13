from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_cors import CORS
from datetime import datetime, timedelta
from functools import wraps
import random
import string

from config import Config
from models import db, Restaurant, User, MenuCategory, MenuItem, Order, OrderItem, Bill, BillItem, Inventory

app = Flask(__name__)
app.config.from_object(Config)

# Initialize extensions
db.init_app(app)
jwt = JWTManager(app)
CORS(app)

# Demo mode flag
DEMO_MODE = False


def admin_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        identity = get_jwt_identity()
        if identity['role'] != 'superadmin' and identity['role'] != 'admin':
            return jsonify({'message': 'Admin access required'}), 403
        return fn(*args, **kwargs)
    return wrapper


def superadmin_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        identity = get_jwt_identity()
        if identity['role'] != 'superadmin':
            return jsonify({'message': 'Superadmin access required'}), 403
        return fn(*args, **kwargs)
    return wrapper


def get_restaurant_id(req):
    identity = get_jwt_identity()
    if identity['role'] == 'superadmin':
        return req.args.get('restaurant_id') or req.json.get('restaurant_id') if req.is_json else None
    return identity['restaurant_id']


# ==================== AUTH ROUTES ====================

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'message': 'Email and password required'}), 400
    
    user = User.query.filter_by(email=email).first()
    
    if user and user.check_password(password):
        access_token = create_access_token(
            identity={
                'id': user.id,
                'email': user.email,
                'name': user.name,
                'role': user.role,
                'restaurant_id': user.restaurant_id
            }
        )
        
        restaurant = Restaurant.query.get(user.restaurant_id) if user.restaurant_id else None
        
        return jsonify({
            'id': user.id,
            'email': user.email,
            'name': user.name,
            'role': user.role,
            'restaurantId': user.restaurant_id,
            'restaurant': restaurant.to_dict() if restaurant else None,
            'token': access_token
        })
    
    return jsonify({'message': 'Invalid email or password'}), 401


@app.route('/api/auth/register', methods=['POST'])
@jwt_required()
@superadmin_required
def register():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    name = data.get('name')
    restaurant_name = data.get('restaurantName')
    phone = data.get('phone')
    address = data.get('address')
    
    if not email or not password or not name:
        return jsonify({'message': 'Email, password, and name are required'}), 400
    
    if User.query.filter_by(email=email).first():
        return jsonify({'message': 'User already exists'}), 400
    
    # Create restaurant
    restaurant = Restaurant(
        name=restaurant_name or f"{name}'s Restaurant",
        phone=phone,
        address=address
    )
    db.session.add(restaurant)
    db.session.flush()
    
    # Create user
    user = User(
        email=email,
        name=name,
        role='admin',
        restaurant_id=restaurant.id,
        phone=phone
    )
    user.set_password(password)
    
    db.session.add(user)
    db.session.commit()
    
    access_token = create_access_token(
        identity={
            'id': user.id,
            'email': user.email,
            'name': user.name,
            'role': user.role,
            'restaurant_id': user.restaurant_id
        }
    )
    
    return jsonify({
        'id': user.id,
        'email': user.email,
        'name': user.name,
        'role': user.role,
        'restaurantId': user.restaurant_id,
        'restaurant': restaurant.to_dict(),
        'token': access_token
    }), 201


@app.route('/api/auth/me', methods=['GET'])
@jwt_required()
def get_current_user():
    identity = get_jwt_identity()
    user = User.query.get(identity['id'])
    
    if not user:
        return jsonify({'message': 'User not found'}), 404
    
    restaurant = Restaurant.query.get(user.restaurant_id) if user.restaurant_id else None
    
    return jsonify({
        'id': user.id,
        'email': user.email,
        'name': user.name,
        'role': user.role,
        'restaurantId': user.restaurant_id,
        'restaurant': restaurant.to_dict() if restaurant else None
    })


# ==================== RESTAURANT ROUTES ====================

@app.route('/api/restaurants', methods=['GET'])
@jwt_required()
def get_restaurants():
    identity = get_jwt_identity()
    
    if identity['role'] == 'superadmin':
        restaurants = Restaurant.query.all()
    else:
        restaurants = [Restaurant.query.get(identity['restaurant_id'])]
    
    return jsonify([r.to_dict() for r in restaurants])


@app.route('/api/restaurants', methods=['POST'])
@jwt_required()
@superadmin_required
def create_restaurant():
    data = request.get_json()
    
    restaurant = Restaurant(
        name=data.get('name'),
        address=data.get('address'),
        phone=data.get('phone'),
        email=data.get('email'),
        logo=data.get('logo'),
        tax_rate=data.get('taxRate', 18)
    )
    
    db.session.add(restaurant)
    db.session.commit()
    
    return jsonify(restaurant.to_dict()), 201


@app.route('/api/restaurants/<int:id>', methods=['GET'])
@jwt_required()
def get_restaurant(id):
    restaurant = Restaurant.query.get_or_404(id)
    return jsonify(restaurant.to_dict())


@app.route('/api/restaurants/<int:id>', methods=['PUT'])
@jwt_required()
@admin_required
def update_restaurant(id):
    identity = get_jwt_identity()
    restaurant = Restaurant.query.get_or_404(id)
    
    if identity['role'] != 'superadmin' and identity['restaurant_id'] != id:
        return jsonify({'message': 'Not authorized'}), 403
    
    data = request.get_json()
    restaurant.name = data.get('name', restaurant.name)
    restaurant.address = data.get('address', restaurant.address)
    restaurant.phone = data.get('phone', restaurant.phone)
    restaurant.email = data.get('email', restaurant.email)
    restaurant.logo = data.get('logo', restaurant.logo)
    restaurant.tax_rate = data.get('taxRate', restaurant.tax_rate)
    restaurant.is_active = data.get('isActive', restaurant.is_active)
    
    db.session.commit()
    return jsonify(restaurant.to_dict())


# ==================== MENU ROUTES ====================

@app.route('/api/menu/categories', methods=['GET'])
@jwt_required()
def get_categories():
    restaurant_id = get_restaurant_id(request)
    if not restaurant_id:
        return jsonify({'message': 'Restaurant ID required'}), 400
    
    categories = MenuCategory.query.filter_by(restaurant_id=restaurant_id, is_active=True).order_by(MenuCategory.sort_order).all()
    return jsonify([c.to_dict() for c in categories])


@app.route('/api/menu/categories', methods=['POST'])
@jwt_required()
@admin_required
def create_category():
    restaurant_id = get_restaurant_id(request)
    data = request.get_json()
    
    category = MenuCategory(
        name=data.get('name'),
        description=data.get('description'),
        restaurant_id=restaurant_id,
        sort_order=data.get('sort_order', 0)
    )
    
    db.session.add(category)
    db.session.commit()
    
    return jsonify(category.to_dict()), 201


@app.route('/api/menu/categories/<int:id>', methods=['PUT'])
@jwt_required()
@admin_required
def update_category(id):
    category = MenuCategory.query.get_or_404(id)
    data = request.get_json()
    
    category.name = data.get('name', category.name)
    category.description = data.get('description', category.description)
    category.is_active = data.get('is_active', category.is_active)
    category.sort_order = data.get('sort_order', category.sort_order)
    
    db.session.commit()
    return jsonify(category.to_dict())


@app.route('/api/menu/categories/<int:id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_category(id):
    category = MenuCategory.query.get_or_404(id)
    category.is_active = False
    db.session.commit()
    return jsonify({'message': 'Category deleted'})


@app.route('/api/menu/items', methods=['GET'])
@jwt_required()
def get_menu_items():
    restaurant_id = get_restaurant_id(request)
    category_id = request.args.get('category_id')
    
    query = MenuItem.query.filter_by(restaurant_id=restaurant_id)
    
    if category_id:
        query = query.filter_by(category_id=category_id)
    
    items = query.all()
    return jsonify([i.to_dict() for i in items])


@app.route('/api/menu/items', methods=['POST'])
@jwt_required()
@admin_required
def create_menu_item():
    restaurant_id = get_restaurant_id(request)
    data = request.get_json()
    
    item = MenuItem(
        name=data.get('name'),
        description=data.get('description'),
        price=data.get('price'),
        image=data.get('image'),
        is_available=data.get('isAvailable', True),
        preparation_time=data.get('preparationTime', 15),
        restaurant_id=restaurant_id,
        category_id=data.get('category_id')
    )
    
    db.session.add(item)
    db.session.commit()
    
    return jsonify(item.to_dict()), 201


@app.route('/api/menu/items/<int:id>', methods=['PUT'])
@jwt_required()
@admin_required
def update_menu_item(id):
    item = MenuItem.query.get_or_404(id)
    data = request.get_json()
    
    item.name = data.get('name', item.name)
    item.description = data.get('description', item.description)
    item.price = data.get('price', item.price)
    item.image = data.get('image', item.image)
    item.is_available = data.get('isAvailable', item.is_available)
    item.preparation_time = data.get('preparationTime', item.preparation_time)
    item.category_id = data.get('category_id', item.category_id)
    
    db.session.commit()
    return jsonify(item.to_dict())


@app.route('/api/menu/items/<int:id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_menu_item(id):
    item = MenuItem.query.get_or_404(id)
    db.session.delete(item)
    db.session.commit()
    return jsonify({'message': 'Item deleted'})


# ==================== ORDER ROUTES ====================

@app.route('/api/orders', methods=['GET'])
@jwt_required()
def get_orders():
    restaurant_id = get_restaurant_id(request)
    status = request.args.get('status')
    order_type = request.args.get('orderType')
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 50))
    
    query = Order.query.filter_by(restaurant_id=restaurant_id)
    
    if status:
        query = query.filter_by(status=status)
    if order_type:
        query = query.filter_by(order_type=order_type)
    
    orders = query.order_by(Order.created_at.desc()).limit(limit).offset((page - 1) * limit).all()
    total = query.count()
    
    return jsonify({
        'orders': [o.to_dict() for o in orders],
        'totalPages': (total + limit - 1) // limit,
        'currentPage': page,
        'total': total
    })


@app.route('/api/orders/stats/today', methods=['GET'])
@jwt_required()
def get_today_stats():
    restaurant_id = get_restaurant_id(request)
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    tomorrow = today + timedelta(days=1)
    
    orders = Order.query.filter(
        Order.restaurant_id == restaurant_id,
        Order.created_at >= today,
        Order.created_at < tomorrow
    ).all()
    
    total_orders = len(orders)
    total_revenue = sum(o.total for o in orders)
    total_tax = sum(o.tax for o in orders)
    total_discount = sum(o.discount for o in orders)
    
    pending = len([o for o in orders if o.status == 'pending'])
    ready = len([o for o in orders if o.status == 'ready'])
    delivered = len([o for o in orders if o.status == 'delivered'])
    
    return jsonify({
        'totalOrders': total_orders,
        'totalRevenue': total_revenue,
        'totalTax': total_tax,
        'totalDiscount': total_discount,
        'averageOrderValue': total_revenue / total_orders if total_orders > 0 else 0,
        'pendingOrders': pending,
        'readyOrders': ready,
        'deliveredOrders': delivered
    })


@app.route('/api/orders/<int:id>', methods=['GET'])
@jwt_required()
def get_order(id):
    order = Order.query.get_or_404(id)
    return jsonify(order.to_dict())


@app.route('/api/orders', methods=['POST'])
@jwt_required()
def create_order():
    restaurant_id = get_restaurant_id(request)
    data = request.get_json()
    
    order_type = data.get('orderType')
    items = data.get('items', [])
    customer_name = data.get('customerName')
    customer_phone = data.get('customerPhone')
    table_number = data.get('tableNumber')
    delivery_address = data.get('deliveryAddress')
    notes = data.get('notes')
    discount = data.get('discount', 0)
    discount_type = data.get('discountType', 'percentage')
    
    if not order_type or not items:
        return jsonify({'message': 'Order type and items required'}), 400
    
    # Get restaurant tax rate
    restaurant = Restaurant.query.get(restaurant_id)
    tax_rate = restaurant.tax_rate if restaurant else 18
    
    # Calculate totals
    subtotal = sum(item['price'] * item['quantity'] for item in items)
    
    # Calculate discount
    discount_amount = 0
    if discount > 0:
        if discount_type == 'percentage':
            discount_amount = (subtotal * discount) / 100
        else:
            discount_amount = discount
    
    # Calculate tax
    taxable_amount = subtotal - discount_amount
    tax = (taxable_amount * tax_rate) / 100
    total = taxable_amount + tax
    
    # Create order
    order = Order(
        restaurant_id=restaurant_id,
        order_type=order_type,
        customer_name=customer_name,
        customer_phone=customer_phone,
        table_number=table_number,
        delivery_address=delivery_address,
        notes=notes,
        subtotal=subtotal,
        tax=tax,
        tax_rate=tax_rate,
        discount=discount_amount,
        discount_type=discount_type,
        total=total,
        status='pending',
        payment_status='pending'
    )
    
    db.session.add(order)
    db.session.flush()
    
    # Add order items
    for item in items:
        order_item = OrderItem(
            order_id=order.id,
            menu_item_id=item.get('menuItemId'),
            name=item.get('name'),
            quantity=item.get('quantity'),
            price=item.get('price'),
            total=item.get('price') * item.get('quantity')
        )
        db.session.add(order_item)
    
    db.session.commit()
    
    return jsonify(order.to_dict()), 201


@app.route('/api/orders/<int:id>', methods=['PUT'])
@jwt_required()
def update_order(id):
    order = Order.query.get_or_404(id)
    data = request.get_json()
    
    # Recalculate if items changed
    if 'items' in data:
        items = data['items']
        subtotal = sum(item['price'] * item['quantity'] for item in items)
        
        # Update discount
        discount_amount = order.discount
        if 'discount' in data:
            discount = data['discount']
            if order.discount_type == 'percentage':
                discount_amount = (subtotal * discount) / 100
            else:
                discount_amount = discount
        
        # Recalculate tax and total
        taxable_amount = subtotal - discount_amount
        tax = (taxable_amount * order.tax_rate) / 100
        total = taxable_amount + tax
        
        order.subtotal = subtotal
        order.discount = discount_amount
        order.tax = tax
        order.total = total
        
        # Update items
        OrderItem.query.filter_by(order_id=order.id).delete()
        for item in items:
            order_item = OrderItem(
                order_id=order.id,
                menu_item_id=item.get('menuItemId'),
                name=item.get('name'),
                quantity=item.get('quantity'),
                price=item.get('price'),
                total=item.get('price') * item.get('quantity')
            )
            db.session.add(order_item)
    
    if 'notes' in data:
        order.notes = data['notes']
    
    db.session.commit()
    return jsonify(order.to_dict())


@app.route('/api/orders/<int:id>/status', methods=['PUT'])
@jwt_required()
def update_order_status(id):
    order = Order.query.get_or_404(id)
    status = request.get_json().get('status')
    
    valid_statuses = ['pending', 'preparing', 'ready', 'delivered', 'cancelled']
    if status not in valid_statuses:
        return jsonify({'message': 'Invalid status'}), 400
    
    order.status = status
    
    if status == 'cancelled':
        order.payment_status = 'refunded'
    
    db.session.commit()
    return jsonify(order.to_dict())


@app.route('/api/orders/<int:id>/payment', methods=['PUT'])
@jwt_required()
def update_order_payment(id):
    order = Order.query.get_or_404(id)
    data = request.get_json()
    
    order.payment_method = data.get('paymentMethod', order.payment_method)
    order.payment_status = data.get('paymentStatus', order.payment_status)
    
    db.session.commit()
    return jsonify(order.to_dict())


@app.route('/api/orders/<int:id>', methods=['DELETE'])
@jwt_required()
def cancel_order(id):
    order = Order.query.get_or_404(id)
    
    if order.bill_id:
        return jsonify({'message': 'Cannot cancel order with existing bill'}), 400
    
    order.status = 'cancelled'
    order.payment_status = 'refunded'
    
    db.session.commit()
    return jsonify({'message': 'Order cancelled', 'order': order.to_dict()})


# ==================== BILL ROUTES ====================

def generate_bill_number():
    return 'INV-' + ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))


@app.route('/api/bills', methods=['GET'])
@jwt_required()
def get_bills():
    restaurant_id = get_restaurant_id(request)
    bills = Bill.query.filter_by(restaurant_id=restaurant_id).order_by(Bill.created_at.desc()).all()
    return jsonify([b.to_dict() for b in bills])


@app.route('/api/bills/<int:id>', methods=['GET'])
@jwt_required()
def get_bill(id):
    bill = Bill.query.get_or_404(id)
    return jsonify(bill.to_dict())


@app.route('/api/bills/generate', methods=['POST'])
@jwt_required()
def generate_bill():
    restaurant_id = get_restaurant_id(request)
    data = request.get_json()
    
    order_id = data.get('order_id')
    payment_method = data.get('paymentMethod', 'cash')
    
    # Get order
    order = Order.query.get(order_id)
    if not order or order.restaurant_id != restaurant_id:
        return jsonify({'message': 'Order not found'}), 404
    
    if order.bill_id:
        return jsonify({'message': 'Bill already exists for this order', 'bill': Bill.query.get(order.bill_id).to_dict()})
    
    # Create bill
    bill = Bill(
        restaurant_id=restaurant_id,
        order_id=order.id,
        bill_number=generate_bill_number(),
        customer_name=order.customer_name,
        table_number=order.table_number,
        subtotal=order.subtotal,
        tax=order.tax,
        tax_rate=order.tax_rate,
        discount=order.discount,
        discount_type=order.discount_type,
        total=order.total,
        payment_method=payment_method,
        payment_status='paid'
    )
    
    db.session.add(bill)
    db.session.flush()
    
    # Add bill items
    for item in order.items:
        bill_item = BillItem(
            bill_id=bill.id,
            menu_item_id=item.menu_item_id,
            name=item.name,
            quantity=item.quantity,
            price=item.price,
            total=item.total
        )
        db.session.add(bill_item)
    
    # Update order
    order.bill_id = bill.id
    order.payment_status = 'paid'
    order.payment_method = payment_method
    
    db.session.commit()
    
    return jsonify(bill.to_dict()), 201


# ==================== INVENTORY ROUTES ====================

@app.route('/api/inventory', methods=['GET'])
@jwt_required()
def get_inventory():
    restaurant_id = get_restaurant_id(request)
    items = Inventory.query.filter_by(restaurant_id=restaurant_id, is_active=True).all()
    return jsonify([i.to_dict() for i in items])


@app.route('/api/inventory', methods=['POST'])
@jwt_required()
@admin_required
def create_inventory_item():
    restaurant_id = get_restaurant_id(request)
    data = request.get_json()
    
    item = Inventory(
        restaurant_id=restaurant_id,
        name=data.get('name'),
        quantity=data.get('quantity', 0),
        unit=data.get('unit', 'pcs'),
        alert_threshold=data.get('alertThreshold', 10),
        category=data.get('category', 'other'),
        purchase_price=data.get('purchasePrice', 0)
    )
    
    db.session.add(item)
    db.session.commit()
    
    return jsonify(item.to_dict()), 201


@app.route('/api/inventory/<int:id>', methods=['PUT'])
@jwt_required()
@admin_required
def update_inventory_item(id):
    item = Inventory.query.get_or_404(id)
    data = request.get_json()
    
    item.name = data.get('name', item.name)
    item.quantity = data.get('quantity', item.quantity)
    item.unit = data.get('unit', item.unit)
    item.alert_threshold = data.get('alertThreshold', item.alert_threshold)
    item.category = data.get('category', item.category)
    item.purchase_price = data.get('purchasePrice', item.purchase_price)
    item.is_active = data.get('isActive', item.is_active)
    
    db.session.commit()
    return jsonify(item.to_dict())


@app.route('/api/inventory/<int:id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_inventory_item(id):
    item = Inventory.query.get_or_404(id)
    item.is_active = False
    db.session.commit()
    return jsonify({'message': 'Item deleted'})


# ==================== REPORTS ROUTES ====================

@app.route('/api/reports/daily', methods=['GET'])
@jwt_required()
def daily_report():
    restaurant_id = get_restaurant_id(request)
    date_str = request.args.get('date')
    
    if date_str:
        date = datetime.strptime(date_str, '%Y-%m-%d')
    else:
        date = datetime.utcnow()
    
    start_of_day = date.replace(hour=0, minute=0, second=0, microsecond=0)
    end_of_day = start_of_day + timedelta(days=1)
    
    orders = Order.query.filter(
        Order.restaurant_id == restaurant_id,
        Order.created_at >= start_of_day,
        Order.created_at < end_of_day
    ).all()
    
    return jsonify({
        'date': start_of_day.strftime('%Y-%m-%d'),
        'totalOrders': len(orders),
        'totalRevenue': sum(o.total for o in orders),
        'totalTax': sum(o.tax for o in orders),
        'totalDiscount': sum(o.discount for o in orders),
        'orders': [o.to_dict() for o in orders]
    })


@app.route('/api/reports/monthly', methods=['GET'])
@jwt_required()
def monthly_report():
    restaurant_id = get_restaurant_id(request)
    year = int(request.args.get('year', datetime.utcnow().year))
    month = int(request.args.get('month', datetime.utcnow().month))
    
    start_of_month = datetime(year, month, 1)
    if month == 12:
        end_of_month = datetime(year + 1, 1, 1)
    else:
        end_of_month = datetime(year, month + 1, 1)
    
    orders = Order.query.filter(
        Order.restaurant_id == restaurant_id,
        Order.created_at >= start_of_month,
        Order.created_at < end_of_month
    ).all()
    
    # Group by day
    daily_data = {}
    for order in orders:
        day = order.created_at.strftime('%Y-%m-%d')
        if day not in daily_data:
            daily_data[day] = {'orders': 0, 'revenue': 0}
        daily_data[day]['orders'] += 1
        daily_data[day]['revenue'] += order.total
    
    return jsonify({
        'year': year,
        'month': month,
        'totalOrders': len(orders),
        'totalRevenue': sum(o.total for o in orders),
        'totalTax': sum(o.tax for o in orders),
        'dailyData': daily_data
    })


@app.route('/api/reports/yearly', methods=['GET'])
@jwt_required()
def yearly_report():
    restaurant_id = get_restaurant_id(request)
    year = int(request.args.get('year', datetime.utcnow().year))
    
    start_of_year = datetime(year, 1, 1)
    end_of_year = datetime(year + 1, 1, 1)
    
    orders = Order.query.filter(
        Order.restaurant_id == restaurant_id,
        Order.created_at >= start_of_year,
        Order.created_at < end_of_year
    ).all()
    
    # Group by month
    monthly_data = {i: {'orders': 0, 'revenue': 0} for i in range(1, 13)}
    for order in orders:
        month = order.created_at.month
        monthly_data[month]['orders'] += 1
        monthly_data[month]['revenue'] += order.total
    
    return jsonify({
        'year': year,
        'totalOrders': len(orders),
        'totalRevenue': sum(o.total for o in orders),
        'totalTax': sum(o.tax for o in orders),
        'monthlyData': monthly_data
    })


# ==================== HEALTH CHECK ====================

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'ok',
        'message': 'Aapki Rasoi API is running',
        'demoMode': DEMO_MODE
    })


# ==================== DATABASE SETUP ====================

def init_db():
    with app.app_context():
        db.create_all()
        
        # Create default superadmin if not exists
        if not User.query.filter_by(email='superadmin@restosaas.com').first():
            superadmin = User(
                email='superadmin@restosaas.com',
                name='Super Admin',
                role='superadmin'
            )
            superadmin.set_password('admin123')
            db.session.add(superadmin)
            
            # Create demo restaurant
            restaurant = Restaurant(
                name='The Golden Fork',
                address='123 Main Street, City Center',
                phone='+1 234 567 890',
                email='info@goldenfork.com',
                tax_rate=18
            )
            db.session.add(restaurant)
            db.session.flush()
            
            # Create demo admin
            admin = User(
                email='admin@goldenfork.com',
                name='Restaurant Admin',
                role='admin',
                restaurant_id=restaurant.id,
                phone='+1 234 567 891'
            )
            admin.set_password('admin123')
            db.session.add(admin)
            
            # Create demo categories
            categories = [
                MenuCategory(name='Appetizers', description='Start your meal right', restaurant_id=restaurant.id, sort_order=1),
                MenuCategory(name='Main Course', description='Hearty main dishes', restaurant_id=restaurant.id, sort_order=2),
                MenuCategory(name='Beverages', description='Refreshing drinks', restaurant_id=restaurant.id, sort_order=3),
                MenuCategory(name='Desserts', description='Sweet endings', restaurant_id=restaurant.id, sort_order=4)
            ]
            for cat in categories:
                db.session.add(cat)
            db.session.flush()
            
            # Create demo menu items
            menu_items = [
                MenuItem(name='Spring Rolls', description='Crispy vegetable spring rolls', price=8.99, restaurant_id=restaurant.id, category_id=categories[0].id, is_available=True),
                MenuItem(name='Garlic Bread', description='Toasted bread with garlic butter', price=5.99, restaurant_id=restaurant.id, category_id=categories[0].id, is_available=True),
                MenuItem(name='Caesar Salad', description='Fresh romaine lettuce with caesar dressing', price=10.99, restaurant_id=restaurant.id, category_id=categories[0].id, is_available=True),
                MenuItem(name='Grilled Salmon', description='Fresh salmon with herbs', price=24.99, restaurant_id=restaurant.id, category_id=categories[1].id, is_available=True),
                MenuItem(name='Ribeye Steak', description='12oz ribeye with vegetables', price=32.99, restaurant_id=restaurant.id, category_id=categories[1].id, is_available=True),
                MenuItem(name='Chicken Parmesan', description='Breaded chicken with marinara', price=18.99, restaurant_id=restaurant.id, category_id=categories[1].id, is_available=True),
                MenuItem(name='Fresh Orange Juice', description='Freshly squeezed', price=5.99, restaurant_id=restaurant.id, category_id=categories[2].id, is_available=True),
                MenuItem(name='Coffee', description='Regular or decaf', price=3.99, restaurant_id=restaurant.id, category_id=categories[2].id, is_available=True),
                MenuItem(name='Chocolate Cake', description='Rich chocolate layer cake', price=8.99, restaurant_id=restaurant.id, category_id=categories[3].id, is_available=True),
                MenuItem(name='Cheesecake', description='New York style', price=9.99, restaurant_id=restaurant.id, category_id=categories[3].id, is_available=True),
            ]
            for item in menu_items:
                db.session.add(item)
            
            # Create demo inventory
            inventory_items = [
                Inventory(name='Chicken', quantity=50, unit='kg', alert_threshold=10, category='meat', restaurant_id=restaurant.id),
                Inventory(name='Rice', quantity=100, unit='kg', alert_threshold=20, category='grains', restaurant_id=restaurant.id),
                Inventory(name='Vegetables', quantity=30, unit='kg', alert_threshold=15, category='vegetables', restaurant_id=restaurant.id),
                Inventory(name='Oil', quantity=20, unit='liters', alert_threshold=5, category='other', restaurant_id=restaurant.id),
            ]
            for inv in inventory_items:
                db.session.add(inv)
            
            db.session.commit()
            print("✅ Demo data created successfully!")
            print("\nLogin Credentials:")
            print("Super Admin: superadmin@restosaas.com / admin123")
            print("Restaurant Admin: admin@goldenfork.com / admin123")


if __name__ == '__main__':
    init_db()
    app.run(debug=True, port=5000)

