import json
import re

def escape_sql_string(value):
    """Escape single quotes in SQL strings"""
    if value is None:
        return 'NULL'
    value = str(value)
    # Escape single quotes by doubling them
    value = value.replace("'", "''")
    return f"'{value}'"

def generate_insert_sql(json_file, sql_file):
    # Read JSON data
    with open(json_file, 'r', encoding='utf-8') as f:
        products = json.load(f)
    
    # SQL insert statement template
    columns = [
        'product_id', 'product_name', 'handle', 'product_url', 'price', 
        'compare_at_price', 'brand', 'category', 'product_type', 'gender', 
        'nation', 'tournament', 'colour', 'size', 'sku', 'sku_id', 
        'variant_id', 'barcode', 'image_url', 'description', 'availability', 
        'collection'
    ]
    
    # Open SQL file for writing
    with open(sql_file, 'w', encoding='utf-8') as f:
        f.write("-- Insert statements for biz_product table\n")
        f.write("-- Generated from product.json\n\n")
        
        # Process products in batches to avoid overly long INSERT statements
        batch_size = 100
        for i in range(0, len(products), batch_size):
            batch = products[i:i+batch_size]
            
            # Start INSERT statement
            f.write("INSERT INTO biz_product (")
            f.write(", ".join(columns))
            f.write(") VALUES\n")
            
            # Add values for each product in the batch
            for j, product in enumerate(batch):
                f.write("(")
                
                # Map JSON fields to SQL values
                values = []
                for col in columns:
                    value = product.get(col, '')
                    
                    # Handle numeric fields
                    if col in ['product_id', 'sku_id', 'variant_id']:
                        if value == '' or value is None:
                            values.append('NULL')
                        else:
                            values.append(str(value))
                    elif col in ['price', 'compare_at_price']:
                        if value == '' or value is None:
                            values.append('NULL')
                        else:
                            values.append(str(float(value)))
                    else:
                        # String fields
                        if value == '' or value is None:
                            values.append('NULL')
                        else:
                            values.append(escape_sql_string(value))
                
                f.write(", ".join(values))
                f.write(")")
                
                # Add comma if not the last item in batch
                if j < len(batch) - 1:
                    f.write(",")
                f.write("\n")
            
            # End INSERT statement
            f.write(";\n\n")
    
    print(f"Successfully generated {sql_file} with {len(products)} products")

if __name__ == "__main__":
    json_file = "product.json"
    sql_file = "insert_product.sql"
    generate_insert_sql(json_file, sql_file)
