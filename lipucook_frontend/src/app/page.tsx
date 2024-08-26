"use client";

import * as React from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Apple,Leaf, Beef, Utensils, CookingPot, Sun, Moon, Dice6, ThumbsUp, ThumbsDown } from 'lucide-react'
import { useTheme } from "next-themes"
import axios from 'axios'

const colorClasses = [
  'border-red-500',
  'border-blue-500',
  'border-green-500',
  'border-yellow-500',
  'border-purple-500',
  'border-pink-500',
  'border-indigo-500',
  'border-orange-500',
]

function getRandomColor() {
  return colorClasses[Math.floor(Math.random() * colorClasses.length)]
}

interface Recipe {
  recipe_id: string;
  recipe_name: string;
  recipe_context: string;
  likes: number;
  dislikes: number;
}

interface AppState {
  selectedVeg: string;
  selectedProtein: string;
  selectedFlavor: string;
  recipe: Recipe | null;
  isLoading: boolean;
  error: string | null;
  isLikeLoading: boolean;
  isDislikeLoading: boolean;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

export default function Component() {
  const [vegetables, setVegetables] = React.useState<string[]>([])
  const [proteins, setProteins] = React.useState<string[]>([])
  const [flavors, setFlavors] = React.useState<string[]>([])
  const [state, setState] = React.useState<AppState>({
    selectedVeg: '',
    selectedProtein: '',
    selectedFlavor: '',
    recipe: null,
    isLoading: true,
    error: null,
    isLikeLoading: false,
    isDislikeLoading: false,
  })
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    fetchIngredients()
  }, [])

  React.useEffect(() => {
    if (mounted) {
      document.documentElement.classList.toggle('dark', theme === 'dark')
    }
  }, [theme, mounted])

  React.useEffect(() => {
    if (state.selectedVeg && state.selectedProtein && state.selectedFlavor) {
      console.log('触发 getRecipe');
      getRecipe();
    }
  }, [state.selectedVeg, state.selectedProtein, state.selectedFlavor]);

  const fetchIngredients = React.useCallback(async () => {
    setState(prevState => ({ ...prevState, isLoading: true, error: null }))
    try {
      console.log('开始获取食材数据')
      
      const [vegResponse, proteinResponse, flavorResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/vegetables?limit=100`),
        axios.get(`${API_BASE_URL}/proteins`),
        axios.get(`${API_BASE_URL}/flavors`)
      ]);

      setVegetables(vegResponse.data.items.map((item: { veg_name: string }) => item.veg_name))
      setProteins(proteinResponse.data.items.map((item: { protein_name: string }) => item.protein_name))
      setFlavors(flavorResponse.data.items.map((item: { flavor_type: string }) => item.flavor_type))

    } catch (error) {
      console.error('获取食材数据失败', error)
      if (axios.isAxiosError(error)) {
        setState(prevState => ({ ...prevState, error: `获取食材数据失败: ${error.message}` }))
      } else {
        setState(prevState => ({ ...prevState, error: '获取食材数据失败，请稍后再试' }))
      }
    } finally {
      setState(prevState => ({ ...prevState, isLoading: false }))
    }
  }, [])

  const getRecipe = React.useCallback(async () => {
    console.log('开始获取菜谱，参数：', { selectedVeg: state.selectedVeg, selectedProtein: state.selectedProtein, selectedFlavor: state.selectedFlavor });
    setState(prevState => ({ ...prevState, isLoading: true, error: null }));
    try {
      const response = await axios.get(`${API_BASE_URL}/find_recipes`, {
        params: {
          veg_id: vegetables.findIndex(v => v === state.selectedVeg) + 1,
          protein_id: proteins.findIndex(p => p === state.selectedProtein) + 1,
          flavor_id: flavors.findIndex(f => f === state.selectedFlavor) + 1
        }
      });
      console.log('API 原始响应数据:', response.data);
      const newRecipe = response.data.recipes && response.data.recipes.length > 0 ? response.data.recipes[0] : null;
      console.log('新的菜谱数据:', newRecipe);
      setState(prevState => {
        console.log('更新前的状态:', prevState);
        const newState = {
          ...prevState,
          isLoading: false,
          recipe: newRecipe,
          error: newRecipe ? null : '没有找到匹配的菜谱'
        };
        console.log('更新后的状态:', newState);
        return newState;
      });
    } catch (error) {
      console.error('获取菜谱失败', error);
      setState(prevState => ({ ...prevState, isLoading: false, recipe: null, error: '获取菜谱失败，请稍后再试' }));
    }
  }, [state.selectedVeg, state.selectedProtein, state.selectedFlavor, vegetables, proteins, flavors])

  const randomSelect = React.useCallback(() => {
    const newVeg = vegetables[Math.floor(Math.random() * vegetables.length)];
    const newProtein = proteins[Math.floor(Math.random() * proteins.length)];
    const newFlavor = flavors[Math.floor(Math.random() * flavors.length)];

    setState(prevState => ({
      ...prevState,
      selectedVeg: newVeg,
      selectedProtein: newProtein,
      selectedFlavor: newFlavor
    }));

    // 立即获取新菜谱
    getRecipe();
  }, [vegetables, proteins, flavors, getRecipe]);

  const handleLike = React.useCallback(async () => {
    if (!state.recipe) return;
    setState(prevState => ({ ...prevState, isLikeLoading: true }));
    try {
      const response = await axios.post(`${API_BASE_URL}/like_recipe/${state.recipe.recipe_id}`);
      setState(prevState => ({
        ...prevState,
        recipe: {
          ...prevState.recipe!,
          likes: response.data.likes
        }
      }));
    } catch (error) {
      console.error('点赞失败', error);
      // 可以在这里添加错误提示
    } finally {
      setState(prevState => ({ ...prevState, isLikeLoading: false }));
    }
  }, [state.recipe]);

  const handleDislike = React.useCallback(async () => {
    if (!state.recipe) return;
    setState(prevState => ({ ...prevState, isDislikeLoading: true }));
    try {
      const response = await axios.post(`${API_BASE_URL}/dislike_recipe/${state.recipe.recipe_id}`);
      setState(prevState => ({
        ...prevState,
        recipe: {
          ...prevState.recipe!,
          dislikes: response.data.dislikes
        }
      }));
    } catch (error) {
      console.error('点踩失败', error);
      // 可以在这里添加错误提示
    } finally {
      setState(prevState => ({ ...prevState, isDislikeLoading: false }));
    }
  }, [state.recipe]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  if (!mounted) return null
  
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white p-2 sm:p-6 transition-colors duration-200">
      <header className="text-center mb-4 sm:mb-8 relative">
        <Button
          variant="outline"
          size="icon"
          className="absolute right-0 top-0"
          onClick={toggleTheme}
        >
          {theme === 'dark' ? <Sun className="h-[1rem] w-[1rem] sm:h-[1.2rem] sm:w-[1.2rem]" /> : <Moon className="h-[1rem] w-[1rem] sm:h-[1.2rem] sm:w-[1.2rem]" />}
        </Button>
        <CookingPot className="mx-auto mb-2" size={36} />
        <h1 className="text-2xl sm:text-3xl font-bold">我要炸厨房!</h1>
      </header>
      {state.isLoading ? (
        <p>正在加载食材数据...</p>
      ) : state.error ? (
        <p className="text-red-500">{state.error}</p>
      ) : (
        <Card className="mb-4 sm:mb-6 bg-white dark:bg-gray-800 shadow-lg relative">
          <CardHeader>
            <CardTitle className="flex items-center text-xl sm:text-2xl">
              <Apple className="mr-2" />
              选择食材
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="w-full max-w-3xl">
              <div className="mb-4 sm:mb-6">
                <h3 className="font-semibold mb-2 sm:mb-4 text-lg sm:text-xl flex items-center justify-center">
                  <Leaf className="mr-2" />
                  蔬菜
                </h3>
                <div className="flex flex-wrap justify-center gap-1 sm:gap-2">
                  {vegetables.map(veg => (
                    <Button
                      key={veg}
                      variant={state.selectedVeg === veg ? "default" : "outline"}
                      onClick={() => setState({ ...state, selectedVeg: veg })}
                      className={`text-xs sm:text-sm border-2 transition-all duration-200 ${getRandomColor()}`}
                    >
                      {veg}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="mb-4 sm:mb-6">
                <h3 className="font-semibold mb-2 sm:mb-4 text-lg sm:text-xl flex items-center justify-center">
                  <Beef className="mr-2" />
                  蛋白质
                </h3>
                <div className="flex flex-wrap justify-center gap-1 sm:gap-2">
                  {proteins.map(protein => (
                    <Button
                      key={protein}
                      variant={state.selectedProtein === protein ? "default" : "outline"}
                      onClick={() => setState({ ...state, selectedProtein: protein })}
                      className={`text-xs sm:text-sm border-2 transition-all duration-200 ${getRandomColor()}`}
                    >
                      {protein}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2 sm:mb-4 text-lg sm:text-xl flex items-center justify-center">
                  <Utensils className="mr-2" />
                  口味
                </h3>
                <div className="flex flex-wrap justify-center gap-1 sm:gap-2">
                  {flavors.map(flavor => (
                    <Button
                      key={flavor}
                      variant={state.selectedFlavor === flavor ? "default" : "outline"}
                      onClick={() => setState({ ...state, selectedFlavor: flavor })}
                      className={`text-xs sm:text-sm border-2 transition-all duration-200 ${getRandomColor()}`}
                    >
                      {flavor}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
          <Button 
            onClick={randomSelect} 
            className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 p-1 sm:p-2 rounded-full bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white transition-all duration-200 hover:rotate-180"
            title="随机选择"
          >
            <Dice6 className="h-6 w-6 sm:h-8 sm:w-8" />
          </Button>
        </Card>
      )}

      <Card className="bg-white dark:bg-gray-800 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-xl sm:text-2xl">
            <Beef className="mr-2" />
            来看看组合出的菜谱吧！
          </CardTitle>
        </CardHeader>
        <CardContent>
          {state.isLoading ? (
            <p>正在加载菜谱...</p>
          ) : state.error ? (
            <p className="text-red-500">{state.error}</p>
          ) : state.recipe ? (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 sm:p-6 shadow-inner">
              <h3 className="font-bold text-xl sm:text-2xl mb-2 sm:mb-4 text-center text-blue-600 dark:text-blue-400">{state.recipe.recipe_name}</h3>
              <p className="mt-2 mb-4 sm:mb-6 text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">{state.recipe.recipe_context}</p>
              <div className="flex justify-center items-center mt-2 sm:mt-4">
                <div className="flex items-center space-x-2 sm:space-x-4">
                  <Button onClick={handleLike} disabled={state.isLikeLoading} className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm">
                    <ThumbsUp className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>{state.isLikeLoading ? '点赞中...' : `点赞 (${state.recipe.likes})`}</span>
                  </Button>
                  <Button onClick={handleDislike} disabled={state.isDislikeLoading} className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm">
                    <ThumbsDown className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>{state.isDislikeLoading ? '点踩中...' : `点踩 (${state.recipe.dislikes})`}</span>
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">
              请选择食材和口味来获取菜谱推荐
            </p>
          )}
        </CardContent>
      </Card>

      <footer className="mt-4 sm:mt-8 text-center text-gray-500 text-xs sm:text-sm">
        当前版本 v0.1.0 (2024/8/25)
        <br />
        Code by 达尔文地雀@psylch, claude-3.5-sonnet@anthropic, v0.dev@vercel, cursor@cursor.ai
      </footer>
    </div>
  )
}