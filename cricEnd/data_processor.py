import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler
from scipy.special import expit  # for sigmoid

# --- STEP 1: Load your dataset ---
df = pd.read_csv("data/IPL_Ball_by_Ball_2008_2022.csv")

# --- STEP 2: Filter only legal deliveries ---
df_valid = df[df['extra_type'].isna()].copy()

# --- STEP 3: Assign match phase based on over number ---
def get_phase(over):
    if over < 6:
        return 'Powerplay'
    elif over < 15:
        return 'Middle'
    else:
        return 'Death'

df_valid['match_phase'] = df_valid['overs'].apply(get_phase)

# --- STEP 4: Count dismissals per batter per phase ---
dismissals = df_valid[df_valid['player_out'].notna()] \
    .groupby(['player_out', 'match_phase']) \
    .size().reset_index(name='dismissals')

# --- STEP 5: Calculate total runs and balls faced per batter per phase ---
runs_balls = df_valid.groupby(['batter', 'match_phase']).agg(
    total_runs=('batsman_run', 'sum'),
    balls_faced=('ballnumber', 'count')
).reset_index()

# --- STEP 6: Merge dismissals info ---
runs_balls = runs_balls.merge(
    dismissals,
    how='left',
    left_on=['batter', 'match_phase'],
    right_on=['player_out', 'match_phase']
)
runs_balls.drop(columns=['player_out'], inplace=True)

# --- STEP 7: Fill missing dismissals with 1 (to avoid divide-by-zero) ---
runs_balls['dismissals'] = runs_balls['dismissals'].fillna(1)

# --- STEP 8: Filter batters with balls_faced < 20 ---
final = runs_balls[runs_balls['balls_faced'] >= 20].copy()

# --- STEP 9: Calculate strike rate and average ---
final['strike_rate'] = (final['total_runs'] / final['balls_faced']) * 100
final['average'] = final['total_runs'] / final['dismissals']

# --- STEP 10: Normalize strike rate and average ---
scaler = MinMaxScaler()
final[['strike_rate_norm', 'average_norm']] = scaler.fit_transform(final[['strike_rate', 'average']])

# --- STEP 11: Compute weighted score based on match phase ---
def compute_weighted_score(row):
    if row['match_phase'] == 'Powerplay':
        return 0.7 * row['strike_rate_norm'] + 0.3 * row['average_norm']
    elif row['match_phase'] == 'Middle':
        return 0.5 * row['strike_rate_norm'] + 0.5 * row['average_norm']
    elif row['match_phase'] == 'Death':
        return 0.8 * row['strike_rate_norm'] + 0.2 * row['average_norm']
    else:
        return 0.5 * row['strike_rate_norm'] + 0.5 * row['average_norm']

final['weighted_score'] = final.apply(compute_weighted_score, axis=1)

# --- STEP 12: Add numeric match_phase column ---
phase_map = {
    'Powerplay': 0,
    'Middle': 1,
    'Death': 2
}
final['match_phase_num'] = final['match_phase'].map(phase_map)

# --- STEP 13: Simulate will_perform using sigmoid(weighted_score - dismissals_norm) ---
max_dismissals = final['dismissals'].max()
final['dismissals_norm'] = final['dismissals'] / max_dismissals

def simulate_label(row):
    score = row['weighted_score'] - row['dismissals_norm']
    prob = expit(score * 5)  # apply sigmoid to smooth the probability
    return 1 if np.random.rand() < prob else 0

final['will_perform'] = final.apply(simulate_label, axis=1)

# Optional: Add noise — flip 10% of the labels randomly
noise = np.random.binomial(1, 0.1, size=len(final))
final['will_perform'] = np.abs(final['will_perform'] - noise)

# --- STEP 14: Sort and export ---
final = final.sort_values(['match_phase', 'weighted_score'], ascending=[True, False])
final.to_csv("top_batters_by_phase.csv", index=False)

print("✅ dataset saved to 'top_batters_by_phase.csv'")
