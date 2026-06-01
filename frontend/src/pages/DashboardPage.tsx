import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useAuth } from '@/hooks/useAuth';
import { useIngredients } from '@/hooks/useIngredients';
import { useRecipes } from '@/hooks/useRecipes';
import { useMealPlans } from '@/hooks/useMealPlans';
import type { UserIngredient } from '@/types';
import styles from './DashboardPage.module.scss';

// ── Helpers ───────────────────────────────────────────────

const DAYS_SHORT = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'];

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' });

// ── Inline edit row ───────────────────────────────────────
interface EditState {
  name: string;
  amount: string;
  unit: string;
}

interface IngredientItemProps {
  ingredient: UserIngredient;
  onEdit: (id: string, payload: Partial<EditState>) => Promise<unknown>;
  onDelete: (id: string) => void;
}

const IngredientItem = ({ ingredient, onEdit, onDelete }: IngredientItemProps) => {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<EditState>({
    name: ingredient.name,
    amount: ingredient.amount ?? '',
    unit: ingredient.unit ?? '',
  });

  const handleSave = async () => {
    if (!form.name.trim()) return;
    await onEdit(ingredient.id, {
      name: form.name.trim(),
      amount: form.amount.trim() || undefined,
      unit: form.unit.trim() || undefined,
    });
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') setEditing(false);
  };

  return (
    <li className={styles.item}>
      {editing ? (
        <div className={styles.editRow}>
          <input
            className={styles.editName}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            onKeyDown={handleKeyDown}
            autoFocus
            placeholder="Namn"
          />
          <input
            className={styles.editAmount}
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            onKeyDown={handleKeyDown}
            placeholder="Mängd"
          />
          <input
            className={styles.editUnit}
            value={form.unit}
            onChange={(e) => setForm({ ...form, unit: e.target.value })}
            onKeyDown={handleKeyDown}
            placeholder="Enhet"
          />
        </div>
      ) : (
        <div className={styles.itemContent}>
          <span className={styles.itemName}>{ingredient.name}</span>
          {(ingredient.amount || ingredient.unit) && (
            <span className={styles.itemMeta}>
              {[ingredient.amount, ingredient.unit].filter(Boolean).join(' ')}
            </span>
          )}
        </div>
      )}

      <div className={styles.actions}>
        {editing ? (
          <>
            <button className={`${styles.iconBtn} ${styles.success}`} onClick={handleSave} title="Spara">✓</button>
            <button className={styles.iconBtn} onClick={() => setEditing(false)} title="Avbryt">✕</button>
          </>
        ) : (
          <>
            <button className={styles.iconBtn} onClick={() => setEditing(true)} title="Redigera">✏️</button>
            <button className={`${styles.iconBtn} ${styles.danger}`} onClick={() => onDelete(ingredient.id)} title="Ta bort">🗑</button>
          </>
        )}
      </div>
    </li>
  );
};

// ── Dashboard Page ────────────────────────────────────────
const DashboardPage = () => {
  const { user } = useAuthStore();
  const { logout } = useAuth();
  const {
    ingredients,
    isLoading: ingLoading,
    error: ingError,
    addIngredient,
    editIngredient,
    removeIngredient,
    clearAll,
    clearError: clearIngError,
  } = useIngredients();

  const { recipes } = useRecipes();
  const { mealPlans } = useMealPlans();

  const [form, setForm] = useState({ name: '', amount: '', unit: '' });
  const [adding, setAdding] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  // ── Stats ──────────────────────────────────────────────
  const favoriteCount = recipes.filter((r) => r.isFavorite).length;

  const today = new Date().toISOString().slice(0, 10);
  const thisWeekPlan = mealPlans.find(
    (p) => p.startDate <= today && p.endDate >= today
  );
  const thisWeekMeals = thisWeekPlan?.days?.length ?? 0;

  // ── Latest recipes (3) ────────────────────────────────
  const latestRecipes = recipes.slice(0, 3);

  // ── Week preview ──────────────────────────────────────
  const getWeekDayMeal = (dayIdx: number) => {
    if (!thisWeekPlan) return null;
    // Prefer dinner, fallback to first meal of that day
    return (
      thisWeekPlan.days?.find((d) => d.dayOfWeek === dayIdx && d.mealType === 'middag') ??
      thisWeekPlan.days?.find((d) => d.dayOfWeek === dayIdx) ??
      null
    );
  };

  // ── Pantry add ────────────────────────────────────────
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setAdding(true);
    await addIngredient({
      name: form.name.trim(),
      amount: form.amount.trim() || undefined,
      unit: form.unit.trim() || undefined,
    });
    setForm({ name: '', amount: '', unit: '' });
    setAdding(false);
    nameRef.current?.focus();
  };

  const handleClearAll = async () => {
    if (!confirm(`Ta bort alla ${ingredients.length} ingredienser??`)) return;
    await clearAll();
  };

  return (
    <div className={styles.dashboard}>
      {/* Header */}
      <header className={styles.header}>
        <span className={styles.logo}>🍳 Lindströms Recept-Generator</span>
        <nav className={styles.nav}>
          <Link to="/dashboard" className={styles.active}>Översikt</Link>
          <Link to="/recipes">Recept</Link>
          <Link to="/meal-plans">Måltidsplan</Link>
          <span className={styles.userName}>{user?.name}</span>
          <button className={styles.logoutBtn} onClick={logout}>Logga ut</button>
        </nav>
      </header>

      {/* Main */}
      <main className={styles.main}>
        <div className={styles.greeting}>
          <h1>Hej, {user?.name?.split(' ')[0]} 👋</h1>
          <p>Här är din köksoversikt.</p>
        </div>

        {/* Stats Row */}
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>🍳</span>
            <div>
              <div className={styles.statValue}>{recipes.length}</div>
              <div className={styles.statLabel}>Recept</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>⭐</span>
            <div>
              <div className={styles.statValue}>{favoriteCount}</div>
              <div className={styles.statLabel}>Favoriter</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>📅</span>
            <div>
              <div className={styles.statValue}>{thisWeekMeals}</div>
              <div className={styles.statLabel}>Denna vecka</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>🥕</span>
            <div>
              <div className={styles.statValue}>{ingredients.length}</div>
              <div className={styles.statLabel}>I skafferi</div>
            </div>
          </div>
        </div>

        {/* Two-column layout */}
        <div className={styles.twoCol}>
          {/* Left: Latest Recipes + Week Preview */}
          <div className={styles.leftCol}>
            {/* Latest Recipes */}
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <h2>Senaste recept</h2>
                <Link to="/recipes" className={styles.seeAll}>Se alla →</Link>
              </div>
              {latestRecipes.length === 0 ? (
                <div className={styles.miniEmpty}>
                  <p>Inga recept ännu. <Link to="/recipes">Generera ditt första →</Link></p>
                </div>
              ) : (
                <div className={styles.recipeList}>
                  {latestRecipes.map((r) => (
                    <div key={r.id} className={styles.recipeRow}>
                      <div className={styles.recipeRowLeft}>
                        <span className={styles.recipeRowTitle}>{r.title}</span>
                        <div className={styles.recipeRowMeta}>
                          {r.difficulty && (
                            <span className={`${styles.diffBadge} ${styles[r.difficulty]}`}>
                              {r.difficulty}
                            </span>
                          )}
                          {(r.prepTime != null || r.cookTime != null) && (
                            <span className={styles.timeChip}>
                              ⏱ {(r.prepTime ?? 0) + (r.cookTime ?? 0)} min
                            </span>
                          )}
                          {r.isFavorite && <span className={styles.favStar}>⭐</span>}
                        </div>
                      </div>
                      <span className={styles.recipeDate}>{formatDate(r.createdAt)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* This Week's Plan Preview */}
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <h2>Denna vecka</h2>
                <Link to="/meal-plans" className={styles.seeAll}>Redigera →</Link>
              </div>
              {thisWeekPlan ? (
                <>
                  <p className={styles.planName}>{thisWeekPlan.name}</p>
                  <div className={styles.weekPreview}>
                    {DAYS_SHORT.map((day, i) => {
                      const slot = getWeekDayMeal(i);
                      return (
                        <div key={i} className={`${styles.weekDay} ${slot ? styles.weekDayFilled : ''}`}>
                          <span className={styles.weekDayLabel}>{day}</span>
                          <span className={styles.weekDayMeal}>
                            {slot
                              ? (slot as { recipe?: { title?: string } }).recipe?.title ?? '—'
                              : '—'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className={styles.miniEmpty}>
                  <p>Ingen plan för denna vecka.</p>
                  <Link to="/meal-plans" className={styles.ctaBtn}>Planera denna vecka →</Link>
                </div>
              )}
            </div>
          </div>

          {/* Right: Pantry Manager */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>
                🥕 Mitt skafferi
                {ingredients.length > 0 && (
                  <span className={styles.badge}>{ingredients.length}</span>
                )}
              </h2>
              <button
                className={styles.clearBtn}
                onClick={handleClearAll}
                disabled={ingredients.length === 0}
              >
                Clear all
              </button>
            </div>

            {/* Add form */}
            <form className={styles.addForm} onSubmit={handleAdd}>
              <input
                ref={nameRef}
                className={styles.nameInput}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ingrediensnamn *"
                required
              />
              <input
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="Mängd"
              />
              <input
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                placeholder="Enhet"
              />
              <button
                type="submit"
                className={styles.addBtn}
                disabled={adding || !form.name.trim()}
              >
                {adding ? '…' : '+ Lägg till'}
              </button>
            </form>

            {/* Error */}
            {ingError && (
              <div className={styles.errorBanner} onClick={clearIngError}>
                {ingError} — klicka för att stänga
              </div>
            )}

            {/* List */}
            {ingLoading ? (
              <div className={styles.loadingRow}>
                <div className={styles.spinner} />
                Laddar ingredienser…
              </div>
            ) : ingredients.length === 0 ? (
              <div className={styles.empty}>
                <div className={styles.emptyIcon}>🧺</div>
                <p>Ditt skafferi är tomt. Lägg till en ingrediens ovan för att komma igång.</p>
              </div>
            ) : (
              <ul className={styles.list}>
                {ingredients.map((ing) => (
                  <IngredientItem
                    key={ing.id}
                    ingredient={ing}
                    onEdit={editIngredient}
                    onDelete={removeIngredient}
                  />
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
