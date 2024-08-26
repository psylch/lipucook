from flask_sqlalchemy import SQLAlchemy
from dataclasses import dataclass

db = SQLAlchemy()

@dataclass
class Recipe(db.Model):
    __tablename__ = 'recipes'
    
    recipe_id: str
    recipe_name: str
    recipe_context: str
    likes: int
    dislikes: int
    social_media_links: dict
    
    recipe_id = db.Column(db.String(7), primary_key=True)
    recipe_name = db.Column(db.String(100), nullable=False)
    recipe_context = db.Column(db.Text)
    likes = db.Column(db.Integer, default=0)
    dislikes = db.Column(db.Integer, default=0)
    social_media_links = db.Column(db.Text)
    veg_id = db.Column(db.Integer, db.ForeignKey('veg_raw.veg_id'))
    protein_id = db.Column(db.Integer, db.ForeignKey('protein_raw.protein_id'))
    flavor_id = db.Column(db.Integer, db.ForeignKey('flavor_raw.flavor_id'))

@dataclass
class VegRaw(db.Model):
    """蔬菜原料数据模型"""
    __tablename__ = 'veg_raw'
    
    veg_id: int
    veg_name: str
    veg_type_id: int
    veg_type_name: str
    
    veg_id = db.Column(db.Integer, primary_key=True)  # 蔬菜ID，主键
    veg_name = db.Column(db.String(50), nullable=False)  # 蔬菜名称
    veg_type_id = db.Column(db.Integer, nullable=False)  # 蔬菜类型ID
    veg_type_name = db.Column(db.String(50), nullable=False)  # 蔬菜类型名称

@dataclass
class ProteinRaw(db.Model):
    """蛋白质原料数据模型"""
    __tablename__ = 'protein_raw'
    
    protein_id: int
    protein_name: str
    protein_type_id: int
    protein_type_name: str
    
    protein_id = db.Column(db.Integer, primary_key=True)  # 蛋白质ID，主键
    protein_name = db.Column(db.String(50), nullable=False)  # 蛋白质名称
    protein_type_id = db.Column(db.Integer, nullable=False)  # 蛋白质类型ID
    protein_type_name = db.Column(db.String(50), nullable=False)  # 蛋白质类型名称

@dataclass
class FlavorRaw(db.Model):
    """口味数据模型"""
    __tablename__ = 'flavor_raw'
    
    flavor_id: int
    flavor_type: str
    
    flavor_id = db.Column(db.Integer, primary_key=True)  # 口味ID，主键
    flavor_type = db.Column(db.String(50), nullable=False)  # 口味类型

@dataclass
class Comment(db.Model):
    """评论数据模型"""
    __tablename__ = 'comments'
    
    comment_id: int
    recipe_id: int
    comment_text: str
    
    comment_id = db.Column(db.Integer, primary_key=True)  # 评论ID，主键
    recipe_id = db.Column(db.Integer, db.ForeignKey('recipes.recipe_id'), nullable=False)  # 关联的菜谱ID，外键
    comment_text = db.Column(db.Text, nullable=False)  # 评论内容