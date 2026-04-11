// Orb + wordmark lockup — two sizes
// SVG orb: radial gradients ending in stopOpacity=0 have no rectangular container artifact.
// overflow:visible on the SVG lets the bloom extend beyond bounds without clipping.

export function LogoHeader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
      <svg width="40" height="40" viewBox="0 0 40 40" style={{ overflow: 'visible', flexShrink: 0 }}>
        <defs>
          <radialGradient id="orbBloom" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#c88020" stopOpacity="0.3"/>
            <stop offset="100%" stopColor="#c88020" stopOpacity="0"/>
          </radialGradient>
          <radialGradient id="orbCore" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1"/>
            <stop offset="28%" stopColor="#fff8e8" stopOpacity="1"/>
            <stop offset="58%" stopColor="#f0d060" stopOpacity="0.75"/>
            <stop offset="80%" stopColor="#b86c10" stopOpacity="0.35"/>
            <stop offset="100%" stopColor="#b86c10" stopOpacity="0"/>
          </radialGradient>
        </defs>
        <circle cx="20" cy="20" r="32" fill="url(#orbBloom)"/>
        <circle cx="20" cy="20" r="18" fill="url(#orbCore)"/>
      </svg>
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
      <svg width="96" height="96" viewBox="0 0 96 96" style={{ overflow: 'visible' }}>
        <defs>
          <radialGradient id="orbBloomLg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#c88020" stopOpacity="0.3"/>
            <stop offset="100%" stopColor="#c88020" stopOpacity="0"/>
          </radialGradient>
          <radialGradient id="orbCoreLg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1"/>
            <stop offset="28%" stopColor="#fff8e8" stopOpacity="1"/>
            <stop offset="58%" stopColor="#f0d060" stopOpacity="0.75"/>
            <stop offset="80%" stopColor="#b86c10" stopOpacity="0.35"/>
            <stop offset="100%" stopColor="#b86c10" stopOpacity="0"/>
          </radialGradient>
        </defs>
        <circle cx="48" cy="48" r="72" fill="url(#orbBloomLg)"/>
        <circle cx="48" cy="48" r="42" fill="url(#orbCoreLg)"/>
      </svg>
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
