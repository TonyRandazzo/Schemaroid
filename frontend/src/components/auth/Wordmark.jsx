export default function Wordmark({ subtitle }) {
  return (
    <div className="mb-8 text-center">
      <h1
        className="text-[clamp(2rem,9vw,3.25rem)] font-black leading-none tracking-[0.14em] text-white"
        style={{ textShadow: '0 2px 24px rgba(0,0,0,.55)' }}
      >
        SCHEMAROID
      </h1>
      <div className="mx-auto mt-4 h-[3px] w-16 rounded-full bg-accent" />
      {subtitle && (
        <p className="mt-4 text-sm text-white/70">{subtitle}</p>
      )}
    </div>
  );
}
