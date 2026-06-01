import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useAuth } from '@/hooks/useAuth';
import { useRecipes } from '@/hooks/useRecipes';
import { useMealPlans } from '@/hooks/useMealPlans';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import type { MealPlan, MealType } from '@/types';
import type { MealPlanDayPayload } from '@/services/mealPlanService';
import styles from './MealPlanPage.module.scss';

// ── Constants ─────────────────────────────────────────────

const DAYS = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'];
const DAY_FULL = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag', 'Söndag'];
const MEAL_TYPES: MealType[] = ['frukost', 'lunch', 'middag', 'mellanmål'];

const mealTypeEmoji: Record<MealType, string> = {
  frukost: '🌅',
  lunch: '☀️',
  middag: '🌙',
  mellanmål: '🍎',
};

// ── Types ─────────────────────────────────────────────────
interface ShoppingItem {
  name: string;
  amount?: string;
  unit?: string;
  count: number;
}

// ── Helpers ───────────────────────────────────────────────

const todayMonday = (): string => {
  const d = new Date();
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1 - day);
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
};

const addDays = (dateStr: string, n: number): string => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

const formatDate = (dateStr: string): string =>
  new Date(dateStr).toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' });

// ── Shopping List Generator ───────────────────────────────

const generateShoppingList = (plan: MealPlan): ShoppingItem[] => {
  const map = new Map<string, ShoppingItem>();
  for (const day of plan.days ?? []) {
    const recipe = (day as { recipe?: { ingredients?: { name: string; amount?: string; unit?: string }[] } }).recipe;
    if (!recipe?.ingredients) continue;
    for (const ing of recipe.ingredients) {
      const key = ing.name.toLowerCase().trim();
      if (map.has(key)) {
        map.get(key)!.count += 1;
      } else {
        map.set(key, { name: ing.name, amount: ing.amount, unit: ing.unit, count: 1 });
      }
    }
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
};

// ── Plan Card ─────────────────────────────────────────────

interface PlanCardProps {
  plan: MealPlan;
  selected: boolean;
  onSelect: () => void;
  onDelete: (id: string) => void;
}

const PlanCard = ({ plan, selected, onSelect, onDelete }: PlanCardProps) => {
  const totalMeals = plan.days?.length ?? 0;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete "${plan.name}"?`)) return;
    onDelete(plan.id);
  };

  return (
    <div
      className={`${styles.planCard} ${selected ? styles.selected : ''}`}
      onClick={onSelect}
    >
      <div className={styles.planCardTop}>
        <div>
          <h3 className={styles.planTitle}>{plan.name}</h3>
          <p className={styles.planDates}>
            {formatDate(plan.startDate)} – {formatDate(plan.endDate)}
          </p>
        </div>
        <button className={styles.deletePlanBtn} onClick={handleDelete} title="Ta bort plan">🗑</button>
      </div>
      <div className={styles.planStats}>
        <span>📅 {totalMeals} måltid{totalMeals !== 1 ? 'er' : ''} planerade</span>
      </div>
    </div>
  );
};

// ── Week Grid ─────────────────────────────────────────────

interface WeekGridProps {
  plan: MealPlan;
  onAddSlot: (dayOfWeek: number, mealType: MealType) => void;
  onRemoveSlot: (dayIndex: number) => void;
}

const WeekGrid = ({ plan, onAddSlot, onRemoveSlot }: WeekGridProps) => {
  const days = plan.days ?? [];

  const getSlot = (dayOfWeek: number, mealType: MealType) =>
    days.find((d) => d.dayOfWeek === dayOfWeek && d.mealType === mealType);

  return (
    <div className={styles.weekGrid}>
      {/* Header row */}
      <div className={styles.gridCorner} />
      {DAYS.map((d, i) => (
        <div key={i} className={styles.gridDayHeader}>
          <span className={styles.dayShort}>{d}</span>
          <span className={styles.dayFull}>{DAY_FULL[i]}</span>
        </div>
      ))}

      {/* Meal rows */}
      {MEAL_TYPES.map((mealType) => (
        <>
          <div key={`label-${mealType}`} className={styles.mealTypeLabel}>
            <span>{mealTypeEmoji[mealType]}</span>
            <span>{mealType}</span>
          </div>
          {DAYS.map((_, dayIdx) => {
            const slot = getSlot(dayIdx, mealType);
            const dayIndex = days.findIndex(
              (d) => d.dayOfWeek === dayIdx && d.mealType === mealType
            );

            return (
              <div
                key={`${dayIdx}-${mealType}`}
                className={`${styles.gridCell} ${slot ? styles.filledCell : styles.emptyCell}`}
              >
                {slot ? (
                  <div className={styles.slotCard}>
                    <span className={styles.slotTitle}>
                      {(slot as { recipe?: { title?: string } }).recipe?.title ?? 'Recipe'}
                    </span>
                    <button
                      className={styles.removeSlotBtn}
                      onClick={() => onRemoveSlot(dayIndex)}
                      title="Ta bort"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    className={styles.addSlotBtn}
                    onClick={() => onAddSlot(dayIdx, mealType)}
                    title="Lägg till recept"
                  >
                    +
                  </button>
                )}
              </div>
            );
          })}
        </>
      ))}
    </div>
  );
};

// ── Mobile Day View ───────────────────────────────────────

interface MobileDayViewProps {
  plan: MealPlan;
  dayIndex: number;
  onPrev: () => void;
  onNext: () => void;
  onAddSlot: (dayOfWeek: number, mealType: MealType) => void;
  onRemoveSlot: (dayIndex: number) => void;
}

const MobileDayView = ({ plan, dayIndex, onPrev, onNext, onAddSlot, onRemoveSlot }: MobileDayViewProps) => {
  const days = plan.days ?? [];

  const getSlot = (mealType: MealType) =>
    days.find((d) => d.dayOfWeek === dayIndex && d.mealType === mealType);

  return (
    <div className={styles.mobileDayView}>
      {/* Day navigation */}
      <div className={styles.mobileDayNav}>
        <button
          className={styles.mobileDayNavBtn}
          onClick={onPrev}
          disabled={dayIndex === 0}
        >
          ←
        </button>
        <span className={styles.mobileDayTitle}>{DAY_FULL[dayIndex]}</span>
        <button
          className={styles.mobileDayNavBtn}
          onClick={onNext}
          disabled={dayIndex === 6}
        >
          →
        </button>
      </div>

      {/* Dot indicators */}
      <div className={styles.mobileDayDots}>
        {DAYS.map((d, i) => (
          <span
            key={i}
            className={`${styles.dot} ${i === dayIndex ? styles.dotActive : ''}`}
            title={DAY_FULL[i]}
          />
        ))}
      </div>

      {/* Meal slots */}
      <div className={styles.mobileMealList}>
        {MEAL_TYPES.map((mealType) => {
          const slot = getSlot(mealType);
          const slotIndex = days.findIndex(
            (d) => d.dayOfWeek === dayIndex && d.mealType === mealType
          );
          return (
            <div key={mealType} className={styles.mobileMealRow}>
              <div className={styles.mobileMealLabel}>
                <span>{mealTypeEmoji[mealType]}</span>
                <span className={styles.mobileMealType}>{mealType}</span>
              </div>
              {slot ? (
                <div className={styles.mobileMealFilled}>
                  <span className={styles.mobileMealTitle}>
                    {(slot as { recipe?: { title?: string } }).recipe?.title ?? 'Recipe'}
                  </span>
                  <button
                    className={styles.mobileRemoveBtn}
                    onClick={() => onRemoveSlot(slotIndex)}
                    title="Ta bort"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  className={styles.mobileAddBtn}
                  onClick={() => onAddSlot(dayIndex, mealType)}
                >
                  + Lägg till recept
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Recipe Picker Modal ───────────────────────────────────

interface RecipePickerProps {
  dayLabel: string;
  mealType: MealType;
  recipes: Array<{ id: string; title: string; prepTime?: number; cookTime?: number }>;
  onPick: (recipeId: string) => void;
  onClose: () => void;
}

const RecipePicker = ({ dayLabel, mealType, recipes, onPick, onClose }: RecipePickerProps) => {
  const [q, setQ] = useState('');
  const filtered = recipes.filter((r) => r.title.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>
            {mealTypeEmoji[mealType]} Add {mealType} — {dayLabel}
          </h3>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <input
          className={styles.pickerSearch}
          type="text"
          placeholder="Sök recept…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoFocus
        />

        <div className={styles.pickerList}>
          {filtered.length === 0 ? (
            <p className={styles.pickerEmpty}>
              {recipes.length === 0
                ? 'Inga recept ännu — generera några på receptsidan!'
                : 'Inga recept matchar din sökning.'}
            </p>
          ) : (
            filtered.map((r) => (
              <button
                key={r.id}
                className={styles.pickerItem}
                onClick={() => onPick(r.id)}
              >
                <span className={styles.pickerItemTitle}>{r.title}</span>
                {(r.prepTime != null || r.cookTime != null) && (
                  <span className={styles.pickerItemMeta}>
                    ⏱ {(r.prepTime ?? 0) + (r.cookTime ?? 0)} min
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// ── Shopping List Modal ───────────────────────────────────

interface ShoppingListModalProps {
  varor: ShoppingItem[];
  planName: string;
  onClose: () => void;
}

const ShoppingListModal = ({ varor, planName, onClose }: ShoppingListModalProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const text = `Inköpslista för "${planName}"\n\n` +
      varor.map((item) => {
        const qty = [item.amount, item.unit].filter(Boolean).join(' ');
        const count = item.count > 1 ? ` (×${item.count})` : '';
        return `• ${item.name}${qty ? ': ' + qty : ''}${count}`;
      }).join('\n');

    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>🛒 Inköpslista</h3>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.shoppingSubheader}>
          <span className={styles.shoppingPlanName}>{planName}</span>
          <span className={styles.shoppingCount}>{varor.length} varor</span>
        </div>

        {varor.length === 0 ? (
          <p className={styles.pickerEmpty}>
            Inga ingredienser hittades — lägg till recept i din plan först.
          </p>
        ) : (
          <div className={styles.shoppingList}>
            {varor.map((item, i) => (
              <div key={i} className={styles.shoppingItem}>
                <span className={styles.shoppingItemName}>{item.name}</span>
                <span className={styles.shoppingItemMeta}>
                  {[item.amount, item.unit].filter(Boolean).join(' ')}
                  {item.count > 1 && <span className={styles.shoppingCount2}>×{item.count}</span>}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className={styles.shoppingFooter}>
          <button className={styles.copyBtn} onClick={handleCopy} disabled={varor.length === 0}>
            {copied ? '✓ Kopierat!' : '📋 Kopiera till urklipp'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── New Plan Form ─────────────────────────────────────────

interface NewPlanFormProps {
  onSubmit: (name: string, startDate: string) => void;
  onCancel: () => void;
}

const NewPlanForm = ({ onSubmit, onCancel }: NewPlanFormProps) => {
  const [name, setName] = useState('Vecka ' + new Date().toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' }));
  const [startDate, setStartDate] = useState(todayMonday());

  return (
    <div className={styles.newPlanForm}>
      <h3>Ny måltidsplan</h3>

      <label className={styles.formLabel}>Plannamn</label>
      <input
        className={styles.formInput}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="t.ex. Vecka 23"
      />

      <label className={styles.formLabel}>Startdatum (måndag)</label>
      <input
        className={styles.formInput}
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
      />

      <div className={styles.formActions}>
        <button className={styles.cancelBtn} onClick={onCancel}>Avbryt</button>
        <button
          className={styles.createBtn}
          onClick={() => name.trim() && onSubmit(name.trim(), startDate)}
          disabled={!name.trim()}
        >
          Create Plan
        </button>
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────

const MealPlanPage = () => {
  const { user } = useAuthStore();
  const { logout } = useAuth();
  const { recipes } = useRecipes();

  const {
    mealPlans,
    isLoading,
    error,
    addMealPlan,
    editMealPlan,
    removeMealPlan,
    clearError,
  } = useMealPlans();

  const [selectedPlan, setSelectedPlan] = useState<MealPlan | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [picker, setPicker] = useState<{ dayOfWeek: number; mealType: MealType } | null>(null);
  const [mobileDay, setMobileDay] = useState(0);
  const [showShoppingList, setShowShoppingList] = useState(false);

  const isMobile = useMediaQuery('(max-width: 767px)');

  // Sync selectedPlan with live mealPlans array so grid updates after edits
  const livePlan = useMemo(
    () => mealPlans.find((p) => p.id === selectedPlan?.id) ?? null,
    [mealPlans, selectedPlan?.id]
  );

  const shoppingItems = useMemo(
    () => livePlan ? generateShoppingList(livePlan) : [],
    [livePlan]
  );

  const handleCreatePlan = async (name: string, startDate: string) => {
    const plan = await addMealPlan({
      name,
      startDate,
      endDate: addDays(startDate, 6),
      days: [],
    });
    if (plan) {
      setSelectedPlan(plan);
      setShowNewForm(false);
    }
  };

  const handleAddSlot = (dayOfWeek: number, mealType: MealType) => {
    setPicker({ dayOfWeek, mealType });
  };

  const handlePickRecipe = async (recipeId: string) => {
    if (!livePlan || !picker) return;

    const currentDays: MealPlanDayPayload[] = (livePlan.days ?? []).map((d) => ({
      dayOfWeek: d.dayOfWeek,
      mealType: d.mealType as MealType,
      recipeId: (d as { recipeId?: string; recipe?: { id: string } }).recipeId
        ?? (d as { recipe?: { id: string } }).recipe?.id ?? '',
    }));

    const newDays: MealPlanDayPayload[] = [
      ...currentDays,
      { dayOfWeek: picker.dayOfWeek, mealType: picker.mealType, recipeId },
    ];

    await editMealPlan(livePlan.id, { days: newDays });
    setPicker(null);
  };

  const handleRemoveSlot = async (dayIndex: number) => {
    if (!livePlan) return;

    const currentDays: MealPlanDayPayload[] = (livePlan.days ?? []).map((d) => ({
      dayOfWeek: d.dayOfWeek,
      mealType: d.mealType as MealType,
      recipeId: (d as { recipeId?: string; recipe?: { id: string } }).recipeId
        ?? (d as { recipe?: { id: string } }).recipe?.id ?? '',
    }));

    const newDays = currentDays.filter((_, i) => i !== dayIndex);
    await editMealPlan(livePlan.id, { days: newDays });
  };

  const pickerDayLabel = picker != null ? DAY_FULL[picker.dayOfWeek] : '';

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <span className={styles.logo}>🍳 Lindströms Recept-Generator</span>
        <nav className={styles.nav}>
          <Link to="/dashboard">Översikt</Link>
          <Link to="/recipes">Recept</Link>
          <Link to="/meal-plans" className={styles.active}>Måltidsplan</Link>
          <span style={{ color: '#555', fontSize: '0.9rem' }}>{user?.name}</span>
          <button onClick={logout}>Logga ut</button>
        </nav>
      </header>

      <div className={styles.main}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h2>Mina planer</h2>
            <button
              className={styles.newPlanBtn}
              onClick={() => { setShowNewForm(true); setSelectedPlan(null); }}
            >
              + New
            </button>
          </div>

          {error && (
            <div className={styles.errorBanner} onClick={clearError}>
              {error} — klicka för att stänga
            </div>
          )}

          {showNewForm && (
            <NewPlanForm
              onSubmit={handleCreatePlan}
              onCancel={() => setShowNewForm(false)}
            />
          )}

          {isLoading ? (
            <div className={styles.loadingRow}>
              <div className={styles.loadSpinner} />Laddar…
            </div>
          ) : mealPlans.length === 0 && !showNewForm ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>📅</div>
              <p>Inga planer ännu. Skapa din första veckomåltidsplan!</p>
            </div>
          ) : (
            <div className={styles.planList}>
              {mealPlans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  selected={livePlan?.id === plan.id}
                  onSelect={() => { setSelectedPlan(plan); setShowNewForm(false); }}
                  onDelete={removeMealPlan}
                />
              ))}
            </div>
          )}
        </aside>

        {/* Content */}
        <section className={styles.content}>
          {livePlan ? (
            <>
              <div className={styles.contentHeader}>
                <div>
                  <h2>{livePlan.name}</h2>
                  <p className={styles.contentDates}>
                    {formatDate(livePlan.startDate)} – {formatDate(livePlan.endDate)}
                    {' · '}
                    {livePlan.days?.length ?? 0}  måltider planerade
                  </p>
                </div>
                <button
                  className={styles.shoppingListBtn}
                  onClick={() => setShowShoppingList(true)}
                  title="Generera inköpslista"
                >
                  🛒 Inköpslista
                </button>
              </div>

              {isMobile ? (
                <MobileDayView
                  plan={livePlan}
                  dayIndex={mobileDay}
                  onPrev={() => setMobileDay((d) => Math.max(0, d - 1))}
                  onNext={() => setMobileDay((d) => Math.min(6, d + 1))}
                  onAddSlot={handleAddSlot}
                  onRemoveSlot={handleRemoveSlot}
                />
              ) : (
                <WeekGrid
                  plan={livePlan}
                  onAddSlot={handleAddSlot}
                  onRemoveSlot={handleRemoveSlot}
                />
              )}
            </>
          ) : (
            <div className={styles.contentEmpty}>
              <div className={styles.contentEmptyIcon}>🗓</div>
              <p>Välj en plan för att visa och redigera dina veckomåltider, eller skapa en ny.</p>
              <button
                className={styles.ctaBtn}
                onClick={() => setShowNewForm(true)}
              >
                + Skapa måltidsplan
              </button>
            </div>
          )}
        </section>
      </div>

      {/* Recipe Picker Modal */}
      {picker && (
        <RecipePicker
          dayLabel={pickerDayLabel}
          mealType={picker.mealType}
          recipes={recipes}
          onPick={handlePickRecipe}
          onClose={() => setPicker(null)}
        />
      )}

      {/* Shopping List Modal */}
      {showShoppingList && livePlan && (
        <ShoppingListModal
          varor={shoppingItems}
          planName={livePlan.name}
          onClose={() => setShowShoppingList(false)}
        />
      )}
    </div>
  );
};

export default MealPlanPage;
