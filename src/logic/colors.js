// Color groups: one shade randomly picked per group each game
export const COLOR_GROUPS = {
  red:    ['#e74c3c', '#c0392b', '#ff6b6b', '#ff4757'],
  blue:   ['#3498db', '#2980b9', '#1e90ff', '#4a90d9'],
  green:  ['#2ecc71', '#27ae60', '#00b894', '#55efc4'],
  yellow: ['#f1c40f', '#f39c12', '#ffd32a', '#ffdd59'],
  purple: ['#9b59b6', '#8e44ad', '#a29bfe', '#6c5ce7'],
  orange: ['#e67e22', '#d35400', '#fd9644', '#fa8231'],
  pink:   ['#fd79a8', '#e84393', '#ff6eb4', '#f368e0'],
  teal:   ['#1abc9c', '#16a085', '#00cec9', '#81ecec'],
  brown:  ['#795548', '#6d4c41', '#a0522d', '#8d6e63'],
};

export const GROUP_NAMES = Object.keys(COLOR_GROUPS);

// Pick n random color groups, then pick one shade from each
export function pickColors(n) {
  const shuffled = [...GROUP_NAMES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n).map(group => {
    const shades = COLOR_GROUPS[group];
    return shades[Math.floor(Math.random() * shades.length)];
  });
}
