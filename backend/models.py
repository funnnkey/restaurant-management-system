from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import bcrypt

db = SQLAlchemy()


class Restaurant(db.Model):
    __tablename__ = 'restaurants'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    address = db.Column(db.String(500))
    phone = db.Column(db.String(50))
    email = db.Column(db.String(120))
    logo = db.Column(db.String(500))
    tax_rate = db.Column(db.Float, default=18.0)
    currency = db.Column(db.String(10), default='₹')
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    users = db.relationship('User', backref='restaurant', lazy=True)
    menu_categories = db.relationship('MenuCategory', backref='restaurant', lazy=True)
    menu_items = db.relationship('MenuItem', backref='restaurant', lazy=True)
    orders = db.relationship('Order', backref='restaurant', lazy=True)
    bills = db.relationship('Bill', backref='restaurant', lazy=True)
    inventory_items = db.relationship('Inventory', backref='restaurant', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'address': self.address,
            'phone': self.phone,
            'email': self.email,
            'logo': self.logo,
            'taxRate': self.tax_rate,
            'currency': self.currency,
            'isActive': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(50))
    role = db.Column(db.String(20), default='admin')  # 'superadmin' or 'admin'
    restaurant_id = db.Column(db.Integer, db.ForeignKey('restaurants.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def set_password(self, password):
        self.password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    def check_password(self, password):
        return bcrypt.checkpw(password.encode('utf-8'), self.password.encode('utf-8'))
    
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'phone': self.phone,
            'role': self.role,
            'restaurantId': self.restaurant_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class MenuCategory(db.Model):
    __tablename__ = 'menu_categories'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(500))
    restaurant_id = db.Column(db.Integer, db.ForeignKey('restaurants.id'), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    sort_order = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    items = db.relationship('MenuItem', backref='category', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'restaurantId': self.restaurant_id,
            'is_active': self.is_active,
            'sort_order': self.sort_order,
            'items': [item.to_dict() for item in self.items] if self.items else []
        }


class MenuItem(db.Model):
    __tablename__ = 'menu_items'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.String(500))
    price = db.Column(db.Float, nullable=False)
    image = db.Column(db.String(500))
    is_available = db.Column(db.Boolean, default=True)
    preparation_time = db.Column(db.Integer, default=15)  # in minutes
    restaurant_id = db.Column(db.Integer, db.ForeignKey('restaurants.id'), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('menu_categories.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'price': self.price,
            'image': self.image,
            'isAvailable': self.is_available,
            'preparationTime': self.preparation_time,
            'restaurantId': self.restaurant_id,
            'categoryId': self.category_id,
            'category': self.category.name if self.category else None,
        }


class Order(db.Model):
    __tablename__ = 'orders'
    
    id = db.Column(db.Integer, primary_key=True)
    restaurant_id = db.Column(db.Integer, db.ForeignKey('restaurants.id'), nullable=False)
    order_type = db.Column(db.String(20), nullable=False)  # 'dine_in', 'take_away', 'delivery'
    status = db.Column(db.String(20), default='pending')  # 'pending', 'preparing', 'ready', 'delivered', 'cancelled'
    customer_name = db.Column(db.String(100))
    customer_phone = db.Column(db.String(50))
    table_number = db.Column(db.String(20))
    delivery_address = db.Column(db.String(500))
    notes = db.Column(db.Text)
    
    subtotal = db.Column(db.Float, default=0)
    tax = db.Column(db.Float, default=0)
    tax_rate = db.Column(db.Float, default=18.0)
    discount = db.Column(db.Float, default=0)
    discount_type = db.Column(db.String(20), default='percentage')
    total = db.Column(db.Float, default=0)
    
    payment_method = db.Column(db.String(20), default='pending')  # 'cash', 'card', 'upi', 'wallet', 'pending'
    payment_status = db.Column(db.String(20), default='pending')  # 'pending', 'paid', 'refunded'
    
    bill_id = db.Column(db.Integer, db.ForeignKey('bills.id'), nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    items = db.relationship('OrderItem', backref='order', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'restaurantId': self.restaurant_id,
            'orderType': self.order_type,
            'status': self.status,
            'customerName': self.customer_name,
            'customerPhone': self.customer_phone,
            'tableNumber': self.table_number,
            'deliveryAddress': self.delivery_address,
            'notes': self.notes,
            'items': [item.to_dict() for item in self.items] if self.items else [],
            'subtotal': self.subtotal,
            'tax': self.tax,
            'taxRate': self.tax_rate,
            'discount': self.discount,
            'discountType': self.discount_type,
            'total': self.total,
            'paymentMethod': self.payment_method,
            'paymentStatus': self.payment_status,
            'billId': self.bill_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class OrderItem(db.Model):
    __tablename__ = 'order_items'
    
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False)
    menu_item_id = db.Column(db.Integer, db.ForeignKey('menu_items.id'), nullable=True)
    name = db.Column(db.String(200), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Float, nullable=False)
    total = db.Column(db.Float, nullable=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'menuItemId': self.menu_item_id,
            'name': self.name,
            'quantity': self.quantity,
            'price': self.price,
            'total': self.total,
        }


class Bill(db.Model):
    __tablename__ = 'bills'
    
    id = db.Column(db.Integer, primary_key=True)
    restaurant_id = db.Column(db.Integer, db.ForeignKey('restaurants.id'), nullable=False)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=True)
    bill_number = db.Column(db.String(50), unique=True, nullable=False)
    customer_name = db.Column(db.String(100))
    table_number = db.Column(db.String(20))
    
    subtotal = db.Column(db.Float, default=0)
    tax = db.Column(db.Float, default=0)
    tax_rate = db.Column(db.Float, default=18.0)
    discount = db.Column(db.Float, default=0)
    discount_type = db.Column(db.String(20), default='percentage')
    total = db.Column(db.Float, default=0)
    
    payment_method = db.Column(db.String(20))
    payment_status = db.Column(db.String(20), default='paid')
    
    split_details = db.Column(db.Text)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    items = db.relationship('BillItem', backref='bill', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'restaurantId': self.restaurant_id,
            'orderId': self.order_id,
            'billNumber': self.bill_number,
            'customerName': self.customer_name,
            'tableNumber': self.table_number,
            'items': [item.to_dict() for item in self.items] if self.items else [],
            'subtotal': self.subtotal,
            'tax': self.tax,
            'taxRate': self.tax_rate,
            'discount': self.discount,
            'discountType': self.discount_type,
            'total': self.total,
            'paymentMethod': self.payment_method,
            'paymentStatus': self.payment_status,
            'splitDetails': self.split_details,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class BillItem(db.Model):
    __tablename__ = 'bill_items'
    
    id = db.Column(db.Integer, primary_key=True)
    bill_id = db.Column(db.Integer, db.ForeignKey('bills.id'), nullable=False)
    menu_item_id = db.Column(db.Integer, db.ForeignKey('menu_items.id'), nullable=True)
    name = db.Column(db.String(200), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Float, nullable=False)
    total = db.Column(db.Float, nullable=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'menuItemId': self.menu_item_id,
            'name': self.name,
            'quantity': self.quantity,
            'price': self.price,
            'total': self.total,
        }


class Inventory(db.Model):
    __tablename__ = 'inventory'
    
    id = db.Column(db.Integer, primary_key=True)
    restaurant_id = db.Column(db.Integer, db.ForeignKey('restaurants.id'), nullable=False)
    name = db.Column(db.String(200), nullable=False)
    quantity = db.Column(db.Float, default=0)
    unit = db.Column(db.String(20), default='pcs')  # 'kg', 'g', 'l', 'ml', 'pcs', 'pack', 'dozen'
    alert_threshold = db.Column(db.Float, default=10)
    category = db.Column(db.String(20), default='other')  # 'vegetables', 'fruits', 'meat', 'dairy', 'grains', 'spices', 'beverages', 'packaging', 'other'
    purchase_price = db.Column(db.Float, default=0)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'restaurantId': self.restaurant_id,
            'name': self.name,
            'quantity': self.quantity,
            'unit': self.unit,
            'alertThreshold': self.alert_threshold,
            'category': self.category,
            'purchasePrice': self.purchase_price,
            'isActive': self.is_active,
            'isLowStock': self.quantity <= self.alert_threshold,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }

