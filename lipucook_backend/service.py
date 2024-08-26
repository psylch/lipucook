from flask import Flask, request, jsonify
from models import db, Recipe, VegRaw, ProteinRaw, FlavorRaw, Comment
from flask_caching import Cache
import random
import os
from flask_cors import CORS
from werkzeug.middleware.dispatcher import DispatcherMiddleware
from werkzeug.exceptions import NotFound

app = Flask(__name__)
CORS(app)  # 添加这一行来启用 CORS
cache = Cache(app, config={'CACHE_TYPE': 'simple'})
app.config['APPLICATION_ROOT'] = '/api'  # 设置应用程序的根路径为 /api

# 数据库配置
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'instance', 'lipucook.db')
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{DB_PATH}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

# 用户评价功能
@app.route('/like_recipe/<string:recipe_id>', methods=['POST'])
def like_recipe(recipe_id):
    recipe = Recipe.query.get(recipe_id)
    if not recipe:
        return jsonify({"error": "菜谱不存在"}), 404
    
    recipe.likes += 1
    db.session.commit()
    return jsonify({"likes": recipe.likes})

# 处理对菜谱的不喜欢评价
@app.route('/dislike_recipe/<string:recipe_id>', methods=['POST'])
def dislike_recipe(recipe_id):
    recipe = Recipe.query.get(recipe_id)
    if not recipe:
        return jsonify({"error": "菜谱不存在"}), 404
    
    recipe.dislikes += 1
    db.session.commit()
    return jsonify({"dislikes": recipe.dislikes})

# 为菜谱添加评论
@app.route('/add_comment/<string:recipe_id>', methods=['POST'])
def add_comment(recipe_id):
    data = request.json
    comment_text = data.get('comment_text')
    
    if not comment_text:
        return jsonify({"error": "评论内容不能为空"}), 400
    
    new_comment = Comment(recipe_id=recipe_id, comment_text=comment_text)
    db.session.add(new_comment)
    db.session.commit()
    
    return jsonify({"comment_id": new_comment.comment_id})

# 获取所有蔬菜数据
@app.route('/vegetables', methods=['GET'])
@cache.cached(timeout=3600)  # 缓存1小时
def get_vegetables():
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 51, type=int)
        vegetables = VegRaw.query.paginate(page=page, per_page=per_page, error_out=False)
        return jsonify({
            'items': [{'veg_id': veg.veg_id, 'veg_name': veg.veg_name, 'veg_type_name': veg.veg_type_name} for veg in vegetables.items],
            'total': vegetables.total,
            'pages': vegetables.pages,
            'current_page': page
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 获取所有蛋白质数据
@app.route('/proteins', methods=['GET'])
@cache.cached(timeout=3600)  # 缓存1小时
def get_proteins():
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        proteins = ProteinRaw.query.paginate(page=page, per_page=per_page, error_out=False)
        return jsonify({
            'items': [{'protein_id': protein.protein_id, 'protein_name': protein.protein_name, 'protein_type_name': protein.protein_type_name} for protein in proteins.items],
            'total': proteins.total,
            'pages': proteins.pages,
            'current_page': page
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 获取所有口味数据
@app.route('/flavors', methods=['GET'])
@cache.cached(timeout=3600)  # 缓存1小时
def get_flavors():
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        flavors = FlavorRaw.query.paginate(page=page, per_page=per_page, error_out=False)
        return jsonify({
            'items': [{'flavor_id': flavor.flavor_id, 'flavor_type': flavor.flavor_type} for flavor in flavors.items],
            'total': flavors.total,
            'pages': flavors.pages,
            'current_page': page
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 通过蔬菜ID、蛋白质ID和口味ID查找菜谱
@app.route('/find_recipes', methods=['GET'])
def find_recipes():
    veg_id = request.args.get('veg_id')
    protein_id = request.args.get('protein_id')
    flavor_id = request.args.get('flavor_id')
    
    if not veg_id:
        return jsonify({"error": "缺少蔬菜ID参数"}), 400
    if not protein_id:
        return jsonify({"error": "缺少蛋白质ID参数"}), 400
    if not flavor_id:
        return jsonify({"error": "缺少口味ID参数"}), 400
    
    recipes = Recipe.query.filter(
        Recipe.veg_id == veg_id,
        Recipe.protein_id == protein_id,
        Recipe.flavor_id == flavor_id
    ).all()
    
    if not recipes:
        return jsonify({"message": "未找到匹配的菜谱"}), 404
    
    return jsonify({
        "recipes": [
            {
                "recipe_id": recipe.recipe_id,
                "recipe_name": recipe.recipe_name,
                "recipe_context": recipe.recipe_context,
                "likes": recipe.likes,
                "dislikes": recipe.dislikes
            } for recipe in recipes
        ]
    })

# 获取特定菜谱的评论
@app.route('/get_comments/<string:recipe_id>', methods=['GET'])
def get_comments(recipe_id):
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    comments = Comment.query.filter_by(recipe_id=recipe_id)\
                            .paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'comments': [
            {
                'comment_id': comment.comment_id,
                'comment_text': comment.comment_text
            } for comment in comments.items
        ],
        'total': comments.total,
        'pages': comments.pages,
        'current_page': page
    })

# 应用程序入口点
if __name__ == '__main__':
    from werkzeug.serving import run_simple
    application = DispatcherMiddleware(NotFound(), {
        '/api': app
    })
    run_simple('0.0.0.0', 1009, application, use_reloader=True, use_debugger=True)