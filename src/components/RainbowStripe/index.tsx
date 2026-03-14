import styles from './RainbowStripe.module.css';

interface Props {
  reversed?: boolean;
}

export function RainbowStripe({ reversed = false }: Props) {
  const colors = ['#e02818', '#e02818', '#f07810', '#f07810', '#f4c010', '#f4c010', '#2aaa30', '#2aaa30', '#1848b8', '#1848b8'];
  const order = reversed ? [...colors].reverse() : colors;
  return (
    <div className={styles.stripe}>
      {order.map((color, i) => (
        <div key={i} style={{ background: color }} />
      ))}
    </div>
  );
}
