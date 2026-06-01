import { useState, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useAuth } from '@/hooks/useAuth';
import { useIngredients } from '@/hooks/useIngredients';
import { useRecipes } from '@/hooks/useRecipes';
import { getRecipeById } from '@/services/recipeService';
import type { Recipe, OptimizationGoal } from '@/types';
import styles from './RecipesPage.module.scss';

// ── Helpers ───────────────────────────────────────────────

const difficultyLabel: Record<string, string> = {
  easy: 'Lätt', medium: 'Medel', hard: 'Svår',
};

// ── Recipe Detail ─────────────────────────────────────────

interface RecipeDetailProps {
  recipe: Recipe;
  onFavorite: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const RecipeDetail = ({ recipe, onFavorite, onDelete, onClose }: RecipeDetailProps) => {
  const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  const instructions = Array.isArray(recipe.instructions) ? recipe.instructions : [];
  const nutrition = recipe.nutrition;

  const [showIngredients, setShowIngredients] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const handleDelete = () => {
    if (!confirm(`Ta bort "${recipe.title}"?`)) return;
    onDelete(recipe.id);
    onClose();
  };

  return (
    <div className={styles.detail}>
      <div className={styles.detailHeader}>
        <h3>{recipe.title}</h3>
        <button className={styles.closeBtn} onClick={onClose} title="Stäng">✕</button>
      </div>

      <div className={styles.detailMeta}>
        {recipe.prepTime != null && <span>⏱ Prep {recipe.prepTime} min</span>}
        {recipe.cookTime != null && <span>🍳 Tillagning {recipe.cookTime} min</span>}
        {recipe.servings  != null && <span>🍽 {recipe.servings} portioner</span>}
        {recipe.difficulty && (
          <span className={`${styles.diffBadge} ${styles[recipe.difficulty]}`}>
            {difficultyLabel[recipe.difficulty]}
          </span>
        )}
      </div>

      {recipe.description && (
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
          {recipe.description}
        </p>
      )}

      {/* Tags */}
      {recipe.tags && recipe.tags.length > 0 && (
        <div className={styles.detailTags}>
          {recipe.tags.map((tag) => (
            <span key={tag} className={styles.tagChip}>{tag}</span>
          ))}
        </div>
      )}

      {/* Ingredients – collapsible */}
      <div className={styles.detailSection}>
        <button
          className={styles.sectionToggle}
          onClick={() => setShowIngredients((v) => !v)}
        >
          <h4>Ingredienser</h4>
          <span className={styles.toggleIcon}>{showIngredients ? '▲' : '▼'}</span>
        </button>
        {showIngredients && (
          <ul className={styles.ingredientList}>
            {ingredients.map((ing, i) => (
              <li key={i}>
                {ing.name}
                {(ing.amount || ing.unit) && (
                  <span> — {[ing.amount, ing.unit].filter(Boolean).join(' ')}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Instructions – collapsible */}
      <div className={styles.detailSection}>
        <button
          className={styles.sectionToggle}
          onClick={() => setShowInstructions((v) => !v)}
        >
          <h4>Instruktioner</h4>
          <span className={styles.toggleIcon}>{showInstructions ? '▲' : '▼'}</span>
        </button>
        {showInstructions && (
          <ol className={styles.instructionList}>
            {instructions.map((step, i) => (
              <li key={i}>
                <span className={styles.stepNum}>{i + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* Nutrition */}
      {nutrition && (
        <div className={styles.detailSection}>
          <h4>Näringsvärden (per portion)</h4>
          <div className={styles.nutritionGrid}>
            {[
              { label: 'Kalorier', value: nutrition.calories, unit: 'kcal' },
              { label: 'Protein',  value: nutrition.protein,  unit: 'g' },
              { label: 'Kolhydrater', value: nutrition.carbs, unit: 'g' },
              { label: 'Fett',     value: nutrition.fat,      unit: 'g' },
              ...(nutrition.fiber != null ? [{ label: 'Fiber', value: nutrition.fiber, unit: 'g' }] : []),
              ...(nutrition.sugar != null ? [{ label: 'Socker', value: nutrition.sugar, unit: 'g' }] : []),
            ].map((n) => (
              <div key={n.label} className={styles.nutItem}>
                <div className={styles.nutValue}>{Math.round(n.value)}</div>
                <div className={styles.nutLabel}>{n.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
        <button
          className={`${styles.favBtn} ${recipe.isFavorite ? styles.favorited : ''}`}
          onClick={() => onFavorite(recipe.id)}
          title={recipe.isFavorite ? 'Ta bort från favoriter' : 'Lägg till i favoriter'}
        >
          {recipe.isFavorite ? '⭐' : '☆'} {recipe.isFavorite ? 'Favorit' : 'Favorit'}
        </button>
        <button className={styles.deleteBtn} onClick={handleDelete}>
          🗑 Ta bort recept
        </button>
      </div>
    </div>
  );
};

// ── Recipe Card ────────────────────────────────────────────

interface RecipeCardProps {
  recipe: Recipe;
  selected: boolean;
  onSelect: () => void;
  onFavorite: (id: string) => void;
  onTagClick: (tag: string) => void;
}

const RecipeCard = ({ recipe, selected, onSelect, onFavorite, onTagClick }: RecipeCardProps) => (
  <div
    className={`${styles.recipeCard} ${selected ? styles.selected : ''}`}
    onClick={onSelect}
  >
    <div className={styles.cardTop}>
      <div>
        <h3 className={styles.cardTitle}>{recipe.title}</h3>
        {recipe.description && (
          <p className={styles.cardDesc}>{recipe.description}</p>
        )}
      </div>
      <button
        className={`${styles.favBtn} ${recipe.isFavorite ? styles.favorited : ''}`}
        onClick={(e) => { e.stopPropagation(); onFavorite(recipe.id); }}
        title={recipe.isFavorite ? 'Ta bort från favoriter' : 'Lägg till i favoriter'}
      >
        {recipe.isFavorite ? '⭐' : '☆'}
      </button>
    </div>

    <div className={styles.cardMeta}>
      {recipe.prepTime != null && <span>⏱ {recipe.prepTime + (recipe.cookTime ?? 0)} min</span>}
      {recipe.servings  != null && <span>🍽 {recipe.servings} port.</span>}
      {recipe.difficulty && (
        <span className={`${styles.diffBadge} ${styles[recipe.difficulty]}`}>
          {difficultyLabel[recipe.difficulty]}
        </span>
      )}
    </div>

    {recipe.tags && recipe.tags.length > 0 && (
      <div className={styles.cardTags} onClick={(e) => e.stopPropagation()}>
        {recipe.tags.slice(0, 4).map((tag) => (
          <button
            key={tag}
            className={styles.tagChip}
            onClick={() => onTagClick(tag)}
            title={`Filtrera på "${tag}"`}
          >
            {tag}
          </button>
        ))}
      </div>
    )}
  </div>
);

// ── Recipes Page ───────────────────────────────────────────

type Filter = 'all' | 'favorites';

const RecipesPage = () => {
  const { user } = useAuthStore();
  const { logout } = useAuth();
  const { ingredients } = useIngredients();

  const {
    recipes,
    isLoading,
    isGenerating,
    error,
    generateRecipe,
    favoriteRecipe,
    removeRecipe,
    clearError,
  } = useRecipes();

  // Generator state
  const [tagInput, setTagInput] = useState('');
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [goal, setGoal] = useState<OptimizationGoal | ''>('');
  const [servings, setServings] = useState('2');
  const [cuisine, setCuisine] = useState('');

  // List / filter state
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  const tagInputRef = useRef<HTMLInputElement>(null);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    recipes.forEach((r) => r.tags?.forEach((t) => set.add(t)));
    return [...set].sort();
  }, [recipes]);

  const addFromPantry = () => {
    const pantryNames = ingredients.map((i) => i.name);
    const merged = Array.from(new Set([...selectedIngredients, ...pantryNames]));
    setSelectedIngredients(merged);
  };

  const addTag = () => {
    const val = tagInput.trim();
    if (!val || selectedIngredients.includes(val)) return;
    setSelectedIngredients((prev) => [...prev, val]);
    setTagInput('');
    tagInputRef.current?.focus();
  };

  const removeTag = (tag: string) => {
    setSelectedIngredients((prev) => prev.filter((t) => t !== tag));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); addTag(); }
  };

  const handleGenerate = async () => {
    if (selectedIngredients.length === 0) return;
    const recipe = await generateRecipe({
      ingredients: selectedIngredients,
      goal: goal || undefined,
      servings: servings ? Number(servings) : undefined,
      cuisine: cuisine || undefined,
    });
    if (recipe) setSelectedRecipe(recipe);
  };

  const handleSelectRecipe = async (recipe: Recipe) => {
    if (selectedRecipe?.id === recipe.id) {
      setSelectedRecipe(null);
      return;
    }
    // If ingredients are missing (loaded from list endpoint), fetch full detail
    if (!Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) {
      try {
        const full = await getRecipeById(recipe.id);
        setSelectedRecipe(full);
      } catch {
        setSelectedRecipe(recipe);
      }
    } else {
      setSelectedRecipe(recipe);
    }
  };

  const handleTagFilterClick = (tag: string) => {
    setActiveTagFilter((prev) => (prev === tag ? null : tag));
    setFilter('all');
  };

  const filteredRecipes = useMemo(() => {
    let list = filter === 'favorites' ? recipes.filter((r) => r.isFavorite) : recipes;
    if (activeTagFilter) {
      list = list.filter((r) => r.tags?.includes(activeTagFilter));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q) ||
          r.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }
    return list;
  }, [recipes, filter, activeTagFilter, search]);

  const activeFiltersCount = (filter === 'favorites' ? 1 : 0) + (activeTagFilter ? 1 : 0) + (search ? 1 : 0);

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <span className={styles.logo}>🍳 Lindströms Recept-Generator</span>
        <nav className={styles.nav}>
          <Link to="/dashboard">Översikt</Link>
          <Link to="/recipes" className={styles.active}>Recept</Link>
          <Link to="/meal-plans">Måltidsplan</Link>
          <span style={{ color: '#555', fontSize: '0.9rem' }}>{user?.name}</span>
          <button onClick={logout}>Logga ut</button>
        </nav>
      </header>

      {/* Main */}
      <div className={styles.main}>
        {/* Generator panel */}
        <aside className={styles.generator}>
          <h2>✨ Generera recept</h2>

          <label className={styles.label}>Ingredienser</label>
          <div className={styles.tagInput}>
            <input
              ref={tagInputRef}
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder="Skriv ingrediens…"
            />
            <button onClick={addTag} title="Lägg till">+</button>
          </div>

          {ingredients.length > 0 && (
            <button
              onClick={addFromPantry}
              style={{
                background: 'none',
                border: '1px dashed var(--color-border)',
                borderRadius: '6px',
                color: 'var(--color-text-muted)',
                fontSize: '0.8rem',
                padding: '4px 10px',
                cursor: 'pointer',
                marginBottom: '0.75rem',
                width: '100%',
              }}
            >
              + Importera från skafferi ({ingredients.length})
            </button>
          )}

          <div className={styles.tags}>
            {selectedIngredients.map((tag) => (
              <span key={tag} className={styles.tag}>
                {tag}
                <button onClick={() => removeTag(tag)}>✕</button>
              </span>
            ))}
          </div>

          <label className={styles.label}>Optimeringsmål</label>
          <select
            className={styles.select}
            value={goal}
            onChange={(e) => setGoal(e.target.value as OptimizationGoal | '')}
          >
            <option value="">Ingen preferens</option>
            <option value="balanced">Balanserad</option>
            <option value="protein">Hög protein</option>
            <option value="lowCarb">Låg kolhydrat</option>
            <option value="vegetarian">Vegetarisk</option>
            <option value="budget">Budgetvänlig</option>
          </select>

          <div className={styles.optionRow}>
            <div>
              <label className={styles.label}>Portioner</label>
              <select value={servings} onChange={(e) => setServings(e.target.value)}>
                {[1,2,3,4,6,8].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={styles.label}>Kök</label>
              <select value={cuisine} onChange={(e) => setCuisine(e.target.value)}>
                <option value="">Valfritt</option>
                <option value="Italienskt">Italienskt</option>
                <option value="Asiatiskt">Asiatiskt</option>
                <option value="Mexikanskt">Mexikanskt</option>
                <option value="Medelhavs">Medelhavs</option>
                <option value="Amerikanskt">Amerikanskt</option>
                <option value="Indiskt">Indiskt</option>
                <option value="Franskt">Franskt</option>
              </select>
            </div>
          </div>

          {error && (
            <div className={styles.errorBanner} onClick={clearError}>
              {error} — klicka för att stänga
            </div>
          )}

          <button
            className={styles.generateBtn}
            onClick={handleGenerate}
            disabled={isGenerating || selectedIngredients.length === 0}
          >
            {isGenerating ? (
              <><span className={styles.spinner} />Genererar…</>
            ) : (
              '✨ Generera recept'
            )}
          </button>
        </aside>

        {/* Recipe list */}
        <section className={styles.listSection}>
          <div className={styles.listHeader}>
            <h2>
              Mina recept
              {recipes.length > 0 && (
                <span style={{ marginLeft: '0.5rem', fontSize: '1rem', color: '#8a8480' }}>
                  ({filteredRecipes.length}{filteredRecipes.length !== recipes.length ? `/${recipes.length}` : ''})
                </span>
              )}
            </h2>

            <div className={styles.searchWrapper}>
              <span className={styles.searchIcon}>🔍</span>
              <input
                className={styles.searchInput}
                type="text"
                placeholder="Sök recept…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button className={styles.clearSearch} onClick={() => setSearch('')} title="Rensa">✕</button>
              )}
            </div>
          </div>

          {/* Filters row */}
          <div className={styles.filtersRow}>
            <div className={styles.filters}>
              <button
                className={filter === 'all' && !activeTagFilter ? styles.activeFilter : ''}
                onClick={() => { setFilter('all'); setActiveTagFilter(null); setSearch(''); }}
              >
                Alla
              </button>
              <button
                className={filter === 'favorites' ? styles.activeFilter : ''}
                onClick={() => { setFilter('favorites'); setActiveTagFilter(null); }}
              >
                ⭐ Favoriter
              </button>
            </div>

            {allTags.length > 0 && (
              <div className={styles.tagFilters}>
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    className={`${styles.tagFilterChip} ${activeTagFilter === tag ? styles.activeTagFilter : ''}`}
                    onClick={() => handleTagFilterClick(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>

          {activeFiltersCount > 0 && filteredRecipes.length === 0 && !isLoading && (
            <div className={styles.noResultsBanner}>
              Inga recept matchar dina filter.{' '}
              <button
                className={styles.clearFiltersBtn}
                onClick={() => { setFilter('all'); setActiveTagFilter(null); setSearch(''); }}
              >
                Rensa filter
              </button>
            </div>
          )}

          {isGenerating && (
            <div className={styles.generatingBanner}>
              <span className={styles.spinner} />
              AI:n skapar ditt recept…
            </div>
          )}

          {isLoading ? (
            <div className={styles.loadingRow}>
              <div className={styles.loadSpinner} />
              Laddar recept…
            </div>
          ) : filteredRecipes.length === 0 && activeFiltersCount === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>
                {filter === 'favorites' ? '⭐' : '📖'}
              </div>
              <p>
                {filter === 'favorites'
                  ? 'Inga favoriter ännu — stjärnmärk ett recept för att spara det här.'
                  : 'Inga recept ännu. Lägg till ingredienser och generera ditt första!'}
              </p>
            </div>
          ) : (
            <div className={styles.recipeGrid}>
              {filteredRecipes.map((r) => (
                <RecipeCard
                  key={r.id}
                  recipe={r}
                  selected={selectedRecipe?.id === r.id}
                  onSelect={() => handleSelectRecipe(r)}
                  onFavorite={favoriteRecipe}
                  onTagClick={handleTagFilterClick}
                />
              ))}
            </div>
          )}

          {/* Detail panel */}
          {selectedRecipe && (
            <RecipeDetail
              recipe={selectedRecipe}
              onFavorite={favoriteRecipe}
              onDelete={removeRecipe}
              onClose={() => setSelectedRecipe(null)}
            />
          )}
        </section>
      </div>
    </div>
  );
};

export default RecipesPage;
