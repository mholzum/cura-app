// Orb + wordmark lockup — two sizes

const orbCore = 'radial-gradient(circle at 50% 50%, #ffffff 0%, #fffbf0 20%, rgba(255,240,180,0.8) 45%, rgba(200,120,20,0.25) 70%, transparent 100%)'

export function LogoHeader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
      <div style={{ position: 'relative', width: '40px', height: '40px', flexShrink: 0, overflow: 'visible' }}>
        <div style={{
          position: 'absolute',
          inset: '-10px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(200,128,32,0.25) 0%, rgba(192,112,24,0.08) 50%, transparent 70%)',
          border: 'none',
          boxShadow: 'none',
        }} />
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: orbCore,
          border: 'none',
          boxShadow: 'none',
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
          inset: '-24px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(200,128,32,0.28) 0%, rgba(192,112,24,0.1) 55%, transparent 100%)',
          border: 'none',
          boxShadow: 'none',
        }} />
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: orbCore,
          border: 'none',
          boxShadow: 'none',
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
