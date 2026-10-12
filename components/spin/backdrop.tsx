// Server Component: static aurora background. Blur is applied once to
// non-animating layers, so it costs nothing per frame.
export function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-ink">
      <div className="absolute -left-[20%] -top-[25%] size-[70vmax] rounded-full bg-[radial-gradient(closest-side,#3cfffc55,transparent)] blur-3xl" />
      <div className="absolute -right-[25%] top-[10%] size-[60vmax] rounded-full bg-[radial-gradient(closest-side,#8b7bff44,transparent)] blur-3xl" />
      <div className="absolute -bottom-[35%] left-[20%] size-[65vmax] rounded-full bg-[radial-gradient(closest-side,#ff6ad533,transparent)] blur-3xl" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,#020917_92%)]" />
      {/* faint grid, a nod to chart paper */}
      <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(#ddf5ff_1px,transparent_1px),linear-gradient(90deg,#ddf5ff_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
    </div>
  );
}
