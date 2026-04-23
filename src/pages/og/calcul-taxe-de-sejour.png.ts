import type { APIRoute } from 'astro';
import { ImageResponse } from '@vercel/og';

export const prerender = false;

export const GET: APIRoute = async () => {
  const bg = '#f7f6f3';
  const green = '#3fbd71';
  const dark = '#2b2d2b';
  const muted = '#8a8985';

  return new ImageResponse(
    {
      type: 'div',
      props: {
        style: {
          width: '100%',
          height: '100%',
          background: bg,
          display: 'flex',
          flexDirection: 'column',
          padding: '60px 72px',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        },
        children: [
          // Header
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '28px'
              },
              children: [
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: 28,
                      fontWeight: 800,
                      color: dark,
                      letterSpacing: '-0.03em',
                      display: 'flex'
                    },
                    children: 'Enomia'
                  }
                },
                {
                  type: 'div',
                  props: {
                    style: {
                      background: 'rgba(63,189,113,0.12)',
                      color: green,
                      fontSize: 15,
                      fontWeight: 700,
                      padding: '8px 18px',
                      borderRadius: 100,
                      letterSpacing: '0.04em',
                      display: 'flex'
                    },
                    children: 'OUTIL GRATUIT'
                  }
                }
              ]
            }
          },
          // Eyebrow
          {
            type: 'div',
            props: {
              style: {
                fontSize: 17,
                color: muted,
                marginBottom: 16,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                fontWeight: 600,
                display: 'flex'
              },
              children: 'Barème officiel DGFiP 2026'
            }
          },
          // Title
          {
            type: 'div',
            props: {
              style: {
                fontSize: 92,
                fontWeight: 600,
                color: dark,
                lineHeight: 1.02,
                letterSpacing: '-0.02em',
                marginBottom: 28,
                display: 'flex',
                flexDirection: 'column'
              },
              children: [
                {
                  type: 'div',
                  props: {
                    style: { display: 'flex' },
                    children: 'Calcul de la'
                  }
                },
                {
                  type: 'div',
                  props: {
                    style: { color: green, fontStyle: 'italic', display: 'flex' },
                    children: 'taxe de séjour'
                  }
                }
              ]
            }
          },
          // Metrics row
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                gap: 20,
                marginTop: 'auto'
              },
              children: [
                ['32 000', 'communes'],
                ['21', "catégories d'hébergement"],
                ['2026', 'tarifs à jour']
              ].map(([n, l]) => ({
                type: 'div',
                props: {
                  style: {
                    flex: 1,
                    background: '#fff',
                    borderRadius: 16,
                    border: '1px solid #e5e3de',
                    padding: '20px 22px',
                    display: 'flex',
                    flexDirection: 'column'
                  },
                  children: [
                    {
                      type: 'div',
                      props: {
                        style: {
                          fontSize: 44,
                          fontWeight: 700,
                          color: dark,
                          letterSpacing: '-0.02em',
                          display: 'flex'
                        },
                        children: n
                      }
                    },
                    {
                      type: 'div',
                      props: {
                        style: {
                          fontSize: 15,
                          color: muted,
                          marginTop: 4,
                          display: 'flex'
                        },
                        children: l
                      }
                    }
                  ]
                }
              }))
            }
          }
        ]
      }
    },
    { width: 1200, height: 630 }
  );
};
