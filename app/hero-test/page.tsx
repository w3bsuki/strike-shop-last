export default function HeroTest() {
  return (
    <div>
      <h1 style={{ fontSize: '48px', color: 'red', background: 'yellow', padding: '20px' }}>
        HERO TEST - IF YOU SEE THIS, NEXT.JS IS WORKING
      </h1>
      <section style={{ 
        position: 'relative', 
        width: '100%', 
        height: '50vh', 
        background: 'black',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div>
          <h2 style={{ fontSize: '36px' }}>STRIKE SS25 - HERO SECTION TEST</h2>
          <p>If you see this, the hero section is rendering</p>
        </div>
      </section>
    </div>
  );
}