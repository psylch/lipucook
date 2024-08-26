export interface Recipe {
  recipe_name: string;
  recipe_context: string;
}

export interface AppState {
  selectedVeg: string;
  selectedProtein: string;
  selectedFlavor: string;
  recipe: Recipe | null;
  isLoading: boolean;
  error: string | null;
}