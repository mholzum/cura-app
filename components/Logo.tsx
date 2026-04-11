// Orb + wordmark lockup — two sizes
// No border-radius on gradient divs — let the radial gradient dissolve to transparent naturally.
// border-radius clips at a hard circle edge even when the gradient is transparent there.

const orbCore = 'radial-gradient(circle at 50% 50%, #ffffff 0%, #fffbf0 20%, rgba(255,240,180,0.8) 45%, rgba(200,120,20,0.25) 70%, transparent 100%)'

export function LogoHeader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', background: 'transparent' }}>
      <div style={{ position: 'relative', width: '40px', height: '40px', flexShrink: 0, overflow: 'visible', background: 'transparent', border: 'none', boxShadow: 'none', outline: 'none', borderRadius: '50%' }}>
        {/* Outer bloom — absolutely positioned, never affects layout */}
        <div style={{
          position: 'absolute',
          inset: '-14px',
          background: 'radial-gradient(circle, rgba(200,128,32,0.22) 0%, rgba(192,112,24,0.07) 55%, transparent 100%)',
          backgroundColor: 'transparent',
        }} />
        {/* Core — no border-radius so gradient dissolves without a hard circular clip */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: orbCore,
          backgroundColor: 'transparent',
        }} />
      </div>
      <span style={{
        fontFamily: "'EB Garamond', Georgia, serif",
        fontSize: '22px',
        fontWeight: 400,
        letterSpacing: '0.26em',
        color: '#f0deb8',
        lineHeight: 1,
      }}>CURA</span>
    </div>
  )
}

export function LogoCenter() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
      <div style={{ position: 'relative', width: '96px', height: '96px', overflow: 'visible' }}>
        <div style={{
          position: 'absolute',
          inset: '-32px',
          background: 'radial-gradient(circle, rgba(200,128,32,0.28) 0%, rgba(192,112,24,0.1) 55%, transparent 100%)',
        }} />
        <div style={{
          position: 'absolute',
          inset: 0,
          background: orbCore,
        }} />
      </div>
      <span style={{
        fontFamily: "'EB Garamond', Georgia, serif",
        fontSize: '48px',
        fontWeight: 400,
        letterSpacing: '0.26em',
        color: '#f0deb8',
        lineHeight: 1,
      }}>CURA</span>
    </div>
  )
}
