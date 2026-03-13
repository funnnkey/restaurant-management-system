import os
from datetime import timedelta

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'aapkirasoi2024'
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'aapkirasoi_jwt_2024'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=30)
    
    # Database
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///restaurant.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # App settings
    TAX_RATE = 18  # GST 18%
    CURRENCY = '₹'

