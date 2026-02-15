import sys
import os

# Add project root to path
sys.path.append(os.getcwd())

from app.models.order_item import OrderItem
from sqlalchemy import inspect

print("Verifying OrderItem model...")
mapper = inspect(OrderItem)
columns = [c.key for c in mapper.attrs]

if "color" in columns:
    print("SUCCESS: 'color' column found in OrderItem model.")
else:
    print("FAILURE: 'color' column NOT found in OrderItem model.")
    sys.exit(1)
