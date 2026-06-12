import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Types ────────────────────────────────────────────────────────────────────

type Theme = 'light' | 'dark' | 'system';
type AgentTone = 'amigable' | 'formal' | 'estricto';

interface SettingsState {
  theme: Theme;
  agentTone: AgentTone;
  budgetAlertThreshold: number; // 0-100 percent
  monthlyIncome: number | null; // in centavos
  isLoaded: boolean;
}

interface SettingsActions {
  setTheme: (theme: Theme) => Promise<void>;
  setAgentTone: (tone: AgentTone) => Promise<void>;
  setBudgetAlertThreshold: (threshold: number) => Promise<void>;
  setMonthlyIncome: (income: number | null) => Promise<void>;
  loadSettings: () => Promise<void>;
}

type SettingsStore = SettingsState & SettingsActions;

// ─── Storage Keys ─────────────────────────────────────────────────────────────

const STORAGE_KEY = '@finanzas_ia_settings';

interface PersistedSettings {
  theme?: Theme;
  agentTone?: AgentTone;
  budgetAlertThreshold?: number;
  monthlyIncome?: number | null;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: SettingsState = {
  theme: 'system',
  agentTone: 'amigable',
  budgetAlertThreshold: 80,
  monthlyIncome: null,
  isLoaded: false,
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  ...DEFAULT_SETTINGS,

  setTheme: async (theme: Theme) => {
    set({ theme });
    await persistSettings({ ...get(), theme });
  },

  setAgentTone: async (agentTone: AgentTone) => {
    set({ agentTone });
    await persistSettings({ ...get(), agentTone });
  },

  setBudgetAlertThreshold: async (budgetAlertThreshold: number) => {
    set({ budgetAlertThreshold });
    await persistSettings({ ...get(), budgetAlertThreshold });
  },

  setMonthlyIncome: async (monthlyIncome: number | null) => {
    set({ monthlyIncome });
    await persistSettings({ ...get(), monthlyIncome });
  },

  loadSettings: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as PersistedSettings;
        set({
          theme: saved.theme ?? DEFAULT_SETTINGS.theme,
          agentTone: saved.agentTone ?? DEFAULT_SETTINGS.agentTone,
          budgetAlertThreshold:
            saved.budgetAlertThreshold ?? DEFAULT_SETTINGS.budgetAlertThreshold,
          monthlyIncome: saved.monthlyIncome ?? DEFAULT_SETTINGS.monthlyIncome,
          isLoaded: true,
        });
      } else {
        set({ isLoaded: true });
      }
    } catch {
      set({ isLoaded: true });
    }
  },
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function persistSettings(state: SettingsState): Promise<void> {
  try {
    const toSave: PersistedSettings = {
      theme: state.theme,
      agentTone: state.agentTone,
      budgetAlertThreshold: state.budgetAlertThreshold,
      monthlyIncome: state.monthlyIncome,
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch {
    // Ignore storage errors
  }
}
