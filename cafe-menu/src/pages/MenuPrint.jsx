// MenuPrint.jsx
import React, { useState, useEffect, useRef } from "react";
import logo from "../assets/logo.png";
import mild from "../assets/strength/mild.png";
import medium from "../assets/strength/medium.png";
import strong from "../assets/strength/strong.png";
import extraStrong from "../assets/strength/extra-strong.png";

const strengthIcons = {
  mild,
  medium,
  strong,
  extraStrong,
};

const MenuPrint = () => {
  const [menuData, setMenuData] = useState([]);
  const [loading, setLoading] = useState(true);
  const printRef = useRef(null);
  const API_BASE_URL = 'http://localhost:5000/api';

  useEffect(() => {
    loadMenuData();
  }, []);

  const loadMenuData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/menu`);
      if (response.ok) {
        const data = await response.json();
        setMenuData(data);
      }
    } catch (error) {
      console.error('Error loading menu:', error);
    } finally {
      setLoading(false);
    }
  };

  // Group items by category
  const groupedMenu = menuData.reduce((acc, item) => {
    const category = item.category || "Others";
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {});

  // Get current date for print
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const handlePrint = () => {
    window.print();
  };

  // Header component
  const MenuHeader = () => (
    <div className="header-content" style={{
      textAlign: 'center',
      borderBottom: '3px double #DBB45F',
      paddingBottom: '14px',
      marginBottom: '18px',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <img 
          src={logo} 
          alt="Café Élan" 
          style={{
            height: '55px',
            width: 'auto',
            objectFit: 'contain',
            marginBottom: '4px',
          }}
        />
      </div>
      
      <p style={{
        fontSize: '11px',
        color: '#EFEADF',
        letterSpacing: '2px',
        fontStyle: 'italic',
        fontFamily: "'Open Sans', 'Segoe UI', sans-serif",
      }}>
        Made for the moments that matter.
      </p>
      <p style={{
        fontSize: '9px',
        color: '#DBB45F',
        marginTop: '3px',
        letterSpacing: '0.5px',
        fontFamily: "'Open Sans', 'Segoe UI', sans-serif",
      }}>
        For Home Delivery Call: 81004 87277 (Charges applied)
      </p>
      <p style={{
        fontSize: '8px',
        color: '#DBB45F80',
        marginTop: '2px',
        letterSpacing: '0.5px',
        fontFamily: "'Open Sans', 'Segoe UI', sans-serif",
      }}>
        {formattedDate}
      </p>
    </div>
  );

  // Footer component
  const MenuFooter = () => (
    <div className="footer-content" style={{
      marginTop: '18px',
      paddingTop: '10px',
      borderTop: '3px double #DBB45F',
      textAlign: 'center',
    }}>
      <p style={{
        fontSize: '9px',
        color: '#DBB45F',
        fontFamily: "'Open Sans', 'Segoe UI', sans-serif",
      }}>
        <strong>Café Élan</strong> - Made for the moments that matter.
      </p>
      <p style={{
        fontSize: '7px',
        color: '#DBB45F60',
        marginTop: '2px',
        fontFamily: "'Open Sans', 'Segoe UI', sans-serif",
      }}>
        Menu printed on {formattedDate}
      </p>
    </div>
  );

  // Render menu items for a category
  const renderCategory = (category, items) => (
    <div 
      key={category} 
      className="category-block"
      style={{
        marginBottom: '16px',
        breakInside: 'avoid',
        pageBreakInside: 'avoid',
      }}
    >
      <h2 style={{
        fontSize: '17px',
        fontWeight: '700',
        color: '#E1DBD2',
        borderBottom: '2px solid #DBB45F',
        paddingBottom: '4px',
        marginBottom: '8px',
        fontFamily: "'Open Sans', 'Segoe UI', sans-serif",
        letterSpacing: '1px',
      }}>
        {category}
        <span style={{
          fontSize: '10px',
          fontWeight: '400',
          color: '#DBB45F',
          marginLeft: '8px',
        }}>
          ({items.length} items)
        </span>
      </h2>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '3px',
      }}>
        {items.map((item, index) => (
          <div 
            key={item.id || index}
            className="menu-item-row"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              padding: '3px 0',
              borderBottom: index < items.length - 1 ? '1px dotted #DBB45F25' : 'none',
              breakInside: 'avoid',
              pageBreakInside: 'avoid',
            }}
          >
            <div style={{
              flex: 1,
              paddingRight: '12px',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                flexWrap: 'wrap',
              }}>
                <span style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#E1DBD2',
                  fontFamily: "'Open Sans', 'Segoe UI', sans-serif",
                }}>
                  {item.name}
                </span>
                {item.is_special === 1 && (
                  <span style={{
                    fontSize: '7px',
                    backgroundColor: '#f59e0b',
                    color: 'white',
                    padding: '1px 5px',
                    borderRadius: '8px',
                    fontWeight: '700',
                    fontFamily: "'Open Sans', 'Segoe UI', sans-serif",
                  }}>
                    ⭐
                  </span>
                )}
                {item.is_bestseller === 1 && (
                  <span style={{
                    fontSize: '7px',
                    backgroundColor: '#dc2626',
                    color: 'white',
                    padding: '1px 5px',
                    borderRadius: '8px',
                    fontWeight: '700',
                    fontFamily: "'Open Sans', 'Segoe UI', sans-serif",
                  }}>
                    🔥
                  </span>
                )}
              </div>
              {item.description && (
                <p style={{
                  fontSize: '9px',
                  color: '#EFEADF',
                  marginTop: '1px',
                  fontStyle: 'italic',
                  lineHeight: '1.2',
                  fontFamily: "'Open Sans', 'Segoe UI', sans-serif",
                }}>
                  {item.description}
                </p>
              )}
              {item.available_in && (
                <p style={{
                  fontSize: '8px',
                  color: '#DBB45F',
                  marginTop: '1px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  fontFamily: "'Open Sans', 'Segoe UI', sans-serif",
                  fontWeight: '600',
                }}>
                  Available in: {item.available_in}
                </p>
              )}
              {item.strength && strengthIcons[item.strength] && (
                <div style={{
                  marginTop: '1px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}>
                  <span style={{
                    fontSize: '7px',
                    color: '#DBB45F',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    fontFamily: "'Open Sans', 'Segoe UI', sans-serif",
                    fontWeight: '600',
                  }}>
                    Taste
                  </span>
                  <img 
                    src={strengthIcons[item.strength]} 
                    alt={item.strength} 
                    style={{
                      height: '10px',
                      width: 'auto',
                      objectFit: 'contain',
                    }} 
                  />
                </div>
              )}
            </div>
            <div style={{
              fontSize: '13px',
              fontWeight: '700',
              color: '#DBB45F',
              whiteSpace: 'nowrap',
              minWidth: '60px',
              textAlign: 'right',
              fontFamily: "'Open Sans', 'Segoe UI', sans-serif",
            }}>
              ₹{item.price}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Calculate pages - keeping categories together, no empty pages
  const calculatePages = () => {
    const categoryEntries = Object.entries(groupedMenu);
    
    // If no categories, return empty array
    if (categoryEntries.length === 0) {
      return [];
    }

    const pages = [];
    let currentPage = [];
    let currentItemCount = 0;
    const MAX_ITEMS_PER_PAGE = 20;

    for (const [category, items] of categoryEntries) {
      // If adding this category would exceed max items and we already have items
      if (currentItemCount + items.length > MAX_ITEMS_PER_PAGE && currentPage.length > 0) {
        pages.push(currentPage);
        currentPage = [];
        currentItemCount = 0;
      }
      currentPage.push({ category, items });
      currentItemCount += items.length;
    }

    // Only add the last page if it has content
    if (currentPage.length > 0) {
      pages.push(currentPage);
    }

    return pages;
  };

  const pages = calculatePages();

  // If no pages, show a message
  if (pages.length === 0) {
    return (
      <div className="min-h-screen bg-[#1C242A] flex items-center justify-center">
        <div className="text-center text-white">
          <p className="text-xl">No menu items available to print.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1C242A] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-white">Loading menu...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Print Button - Visible only on screen */}
      <div className="fixed top-4 right-4 z-50 print:hidden">
        <button
          onClick={handlePrint}
          className="bg-amber-600 text-white px-6 py-3 rounded-lg shadow-lg hover:bg-amber-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print Menu
        </button>
      </div>

      {/* Printable Pages */}
      <div ref={printRef} className="print-wrapper">
        {pages.map((pageData, pageIndex) => (
          <div 
            key={pageIndex} 
            className="print-page"
            style={{
              width: '100%',
              minHeight: '100vh',
              padding: '20px 35px 25px 35px',
              backgroundColor: '#1C242A',
              fontFamily: "'Open Sans', 'Segoe UI', sans-serif",
              boxSizing: 'border-box',
              position: 'relative',
              pageBreakAfter: pageIndex < pages.length - 1 ? 'always' : 'auto',
            }}
          >
            {/* Background Design */}
            <div className="bg-design" style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              opacity: 0.04,
              pointerEvents: 'none',
              overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute',
                top: '-80px',
                right: '-80px',
                width: '300px',
                height: '300px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, #DBB45F, transparent)',
              }} />
              <div style={{
                position: 'absolute',
                bottom: '-80px',
                left: '-80px',
                width: '250px',
                height: '250px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, #DBB45F, transparent)',
              }} />
            </div>

            {/* Header */}
            <MenuHeader />

            {/* Content */}
            <div className="page-content">
              {pageData.map(({ category, items }) => renderCategory(category, items))}
            </div>

            {/* Footer */}
            <MenuFooter />

            {/* Page Number */}
            <div style={{
              position: 'absolute',
              bottom: '8px',
              right: '35px',
              fontSize: '7px',
              color: '#DBB45F40',
              fontFamily: "'Open Sans', 'Segoe UI', sans-serif",
            }}>
              Page {pageIndex + 1} of {pages.length}
            </div>
          </div>
        ))}
      </div>

      {/* Print Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;600;700;800&display=swap');

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background: #1C242A !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
          width: 100% !important;
          min-height: 100% !important;
        }

        .print-wrapper {
          background: #1C242A !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        .print-page {
          background: #1C242A !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }

        .print-page * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }

        .bg-design {
          display: none !important;
        }

        .category-block {
          break-inside: avoid !important;
          page-break-inside: avoid !important;
        }

        .menu-item-row {
          break-inside: avoid !important;
          page-break-inside: avoid !important;
        }

        .header-content {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        .footer-content {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #1C242A !important;
            width: 100% !important;
            min-height: 100% !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          @page {
            margin: 0 !important;
            padding: 0 !important;
            size: auto;
          }
          
          .print-page {
            width: 100% !important;
            min-height: 100vh !important;
            padding: 18px 30px 20px 30px !important;
            margin: 0 !important;
            background: #1C242A !important;
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            page-break-after: always !important;
          }
          
          /* Remove page break after last page */
          .print-page:last-child {
            page-break-after: auto !important;
          }
          
          .print-page * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          .print\\:hidden {
            display: none !important;
          }
          
          .print-page img {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .bg-design {
            display: none !important;
          }
          
          .category-block {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          
          .menu-item-row {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }

        @media screen {
          body {
            background: #1C242A;
            padding: 20px;
          }
          
          .print-page {
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            border-radius: 8px;
            margin: 20px auto;
            max-width: 1100px;
          }
        }
      `}</style>
    </>
  );
};

export default MenuPrint;