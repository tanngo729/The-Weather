
export default function WeatherBackground({ theme = 'theme-clear', fx = 'med', night = false }) {
  return (
    <div className={`bg-video fx-${fx} ${theme}`} aria-hidden="true">
      <div className="bg-gradient" />
    </div>
  );
}
