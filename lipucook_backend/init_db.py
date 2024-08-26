import json
import pandas as pd
from service import app
from models import db, VegRaw, ProteinRaw, FlavorRaw, Recipe
import random
import string
import os

# 在文件开头添加这行代码
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def load_json_data(file_path):
    with open(file_path, 'r', encoding='utf-8') as file:
        return json.load(file)

def generate_recipe_id():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=7))

def init_db(batch_size=1000):
    with app.app_context():
        db.create_all()  # 创建所有表

        # 处理蔬菜数据
        if db.session.query(VegRaw).count() == 0:
            veg_data = load_json_data(os.path.join(BASE_DIR, 'dataset', 'veg_raw.json'))
            for i in range(0, len(veg_data), batch_size):
                batch = veg_data[i:i+batch_size]
                for veg in batch:
                    db.session.add(VegRaw(**veg))
                db.session.commit()
        else:
            print("VegRaw 表已有数据，跳过插入")

        # 处理蛋白质数据
        if db.session.query(ProteinRaw).count() == 0:
            protein_data = load_json_data(os.path.join(BASE_DIR, 'dataset', 'protein_raw.json'))
            for i in range(0, len(protein_data), batch_size):
                batch = protein_data[i:i+batch_size]
                for protein in batch:
                    db.session.add(ProteinRaw(**protein))
                db.session.commit()
        else:
            print("ProteinRaw 表已有数据，跳过插入")

        # 处理口味数据
        if db.session.query(FlavorRaw).count() == 0:
            flavor_data = load_json_data(os.path.join(BASE_DIR, 'dataset', 'flavor_raw.json'))
            for i in range(0, len(flavor_data), batch_size):
                batch = flavor_data[i:i+batch_size]
                for flavor in batch:
                    db.session.add(FlavorRaw(**flavor))
                db.session.commit()
        else:
            print("FlavorRaw 表已有数据，跳过插入")

        # 处理菜谱数据
        if db.session.query(Recipe).count() == 0:
            recipes_df = pd.read_excel(os.path.join(BASE_DIR, 'dataset', 'processed_dish_combinations.xlsx'))
            for i in range(0, len(recipes_df), batch_size):
                batch = recipes_df.iloc[i:i+batch_size]
                for _, row in batch.iterrows():
                    recipe = Recipe(
                        recipe_id=generate_recipe_id(),
                        recipe_name=row['recipe_name'],
                        recipe_context=row.get('recipe_context', ''),
                        likes=0,
                        dislikes=0,
                        social_media_links=json.dumps({}),
                        veg_id=row.get('veg_id'),
                        protein_id=row.get('protein_id'),
                        flavor_id=row.get('flavor_id')
                    )
                    db.session.add(recipe)
                db.session.commit()
        else:
            print("Recipe 表已有数据，跳过插入")

    print("数据库初始化完成")

if __name__ == "__main__":
    init_db()