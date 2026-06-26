import { useEffect, useState, useRef } from "react";
import { 
  FaSearch, FaChevronDown, FaChevronUp, FaRobot, FaTimes,
  FaChevronLeft, FaChevronRight 
} from "react-icons/fa";
import mild from "../assets/strength/mild.png";
import medium from "../assets/strength/medium.png";
import strong from "../assets/strength/strong.png";
import extraStrong from "../assets/strength/extra-strong.png";
import logo from "../assets/logo.png";
import Chatbot from "../components/Chatbot";

const strengthIcons = {
  mild,
  medium,
  strong,
  extraStrong,
};

export default function Menu() {
  const [menuData, setMenuData] = useState([]);
  const [openCategory, setOpenCategory] = useState("");
  const [search, setSearch] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("");
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  // Refs for scrolling
  const categoryRefs = useRef({});
  const categoriesScrollRef = useRef(null);
  const searchHeaderRef = useRef(null);
  const categoryChipsRef = useRef(null);

  const API_BASE_URL = 'http://localhost:5000/api';

  useEffect(() => {
    loadMenuFromAPI();
  }, []);

  // Check scroll position for arrows
  const checkScrollPosition = () => {
    if (categoriesScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = categoriesScrollRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 5);
    }
  };

  // Scroll categories left/right
  const scrollCategories = (direction) => {
    if (categoriesScrollRef.current) {
      const scrollAmount = 200;
      const newScrollLeft = categoriesScrollRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
      categoriesScrollRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  // Add scroll event listener
  useEffect(() => {
    const scrollContainer = categoriesScrollRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', checkScrollPosition);
      checkScrollPosition();
      return () => scrollContainer.removeEventListener('scroll', checkScrollPosition);
    }
  }, [menuData]);

  const loadMenuFromAPI = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/menu`);
      if (response.ok) {
        const data = await response.json();
        setMenuData(data);
        if (data.length > 0) {
          const firstCategory = data[0].category || "Others";
          setOpenCategory(firstCategory);
        }
      }
    } catch (error) {
      console.error('Error loading menu:', error);
    } finally {
      setLoading(false);
    }
  };

  // Simple scroll to category
  const scrollToCategory = (category) => {
    setOpenCategory(category);
    setActiveCategory(category);
  
    setTimeout(() => {
      const element = categoryRefs.current[category];
      if (element) {
        const stickyOffset = 140;
        const top = element.getBoundingClientRect().top + window.scrollY - stickyOffset;
        window.scrollTo({ top, behavior: "smooth" });
      }
    }, 100);
  };

  // Filter and group items
  const filtered = menuData.filter(
    (item) =>
      item.name?.toLowerCase().includes(search.toLowerCase()) ||
      item.category?.toLowerCase().includes(search.toLowerCase()) ||
      item.description?.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = filtered.reduce((acc, item) => {
    const category = item.category || "Others";
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {});

  const categories = Object.keys(grouped);

  if (loading) {
    return (
      <div className="min-h-screen bg-cafe-dark flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-cafe-accent-l">Loading menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cafe-dark text-cafe-accent-y relative">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-72 h-72 bg-cafe rounded-full blur-3xl" />
        <div className="relative text-center py-12 px-6">
          <img src={logo} alt="Café Élan" className="mx-auto h-24 md:h-32 w-auto object-contain" />
          <p className="mt-3 text-cafe-accent-d">Made for the moments that matter.</p>
        </div>
      </div>

      {/* Search Bar - Sticky */}
      <div ref={searchHeaderRef} className="sticky top-0 z-40 pt-4 px-4 pb-4 backdrop-blur-xl bg-gradient-to-b from-cafe-dark via-cafe/90 to-transparent">
        <div className="max-w-3xl mx-auto flex items-center bg-white/10 backdrop-blur-xl border border-white/20 rounded-full px-5 py-3 shadow-lg">
          <FaSearch className="text-cafe-accent-d mr-3" />
          <input
            type="text"
            placeholder="Search your favourites..."
            className="bg-transparent w-full outline-none text-cafe-accent-y placeholder:text-zinc-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Category Chips with Navigation Arrows - Sticky */}
      {categories.length > 0 && (
        <div ref={categoryChipsRef} className="sticky top-[72px] z-40 bg-cafe-dark/95 backdrop-blur-xl border-b border-white/10 shadow-lg">
          <div className="max-w-3xl mx-auto px-4 py-3 relative">
            {/* Left Arrow */}
            {showLeftArrow && (
              <button
                onClick={() => scrollCategories('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-cafe-dark/90 backdrop-blur text-amber-500 p-2 rounded-full shadow-lg hover:bg-amber-500/20 transition-all duration-200"
                style={{ marginLeft: '-8px' }}
              >
                <FaChevronLeft size={16} />
              </button>
            )}

            {/* Scrollable Categories */}
            <div
              ref={categoriesScrollRef}
              className="flex gap-2 overflow-x-auto no-scrollbar scroll-smooth"
            >
              {categories.map((cat) => (
                <button
                  key={cat}
                  data-chip={cat}
                  onClick={() => scrollToCategory(cat)}
                  className={`px-4 py-2 rounded-full border whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
                    activeCategory === cat
                      ? "bg-amber-500 text-black border-amber-400 shadow-lg shadow-amber-500/20"
                      : openCategory === cat
                      ? "bg-amber-500/30 border-amber-400/50 text-amber-300"
                      : "bg-white/5 border-white/10 hover:bg-amber-500/20 hover:border-amber-500/30"
                  }`}
                >
                  {cat}
                  <span className="ml-2 text-xs opacity-70">({grouped[cat].length})</span>
                </button>
              ))}
            </div>

            {/* Right Arrow */}
            {showRightArrow && (
              <button
                onClick={() => scrollCategories('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-cafe-dark/90 backdrop-blur text-amber-500 p-2 rounded-full shadow-lg hover:bg-amber-500/20 transition-all duration-200"
                style={{ marginRight: '-8px' }}
              >
                <FaChevronRight size={16} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Categories Sections */}
      <div className="max-w-3xl mx-auto p-6 px-7 pb-10 space-y-5">
        {Object.entries(grouped).map(([category, items]) => {
          const isOpen = openCategory === category;
          return (
            <div
              key={category}
              ref={el => categoryRefs.current[category] = el}
              data-category={category}
              className="rounded-3xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-xl"
            >
              <button
                className="category-header w-full flex justify-between items-center px-6 py-5 transition-colors duration-200 hover:bg-white/5"
                onClick={() => setOpenCategory(isOpen ? "" : category)}
              >
                <div className="text-left">
                  <h2 className="text-2xl font-semibold">{category}</h2>
                  <p className="text-sm text-cafe-accent-d">{items.length} items</p>
                </div>
                {isOpen ? (
                  <FaChevronUp className="text-cafe-accent-y text-xl transition-transform duration-300" />
                ) : (
                  <FaChevronDown className="text-cafe-accent-y text-xl transition-transform duration-300" />
                )}
              </button>

              {isOpen && (
                <div className="px-4 pb-4 space-y-3 animate-fadeIn">
                  {items.map((item, index) => (
                    <div
                      key={item.id || index}
                      className="rounded-2xl p-4 bg-black/20 border border-white/5 transition-all duration-300 hover:border-amber-400/30 hover:bg-white/5"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-lg font-medium">{item.name}</h3>
                            {item.is_special === 1 && (
                              <span className="text-xs px-2 py-1 rounded-full bg-yellow-600 text-white flex items-center gap-1">
                                ⭐ Special
                              </span>
                            )}
                            {item.is_bestseller === 1 && (
                              <span className="text-xs px-2 py-1 rounded-full bg-red-600 text-white flex items-center gap-1">
                                🔥 Best Seller
                              </span>
                            )}
                          </div>

                          {item.description && (
                            <p className="text-sm text-cafe-accent-d mt-1">{item.description}</p>
                          )}

                          {item.available_in && (
                            <p className="text-xs text-cafe-accent mt-2 tracking-wide uppercase">
                              Available in: {item.available_in}
                            </p>
                          )}

                          {item.strength && strengthIcons[item.strength] && (
                            <div className="mt-2 flex items-center gap-2">
                              <span className="text-xs text-cafe-accent-d uppercase tracking-wider">Taste Profile</span>
                              <img src={strengthIcons[item.strength]} alt={item.strength} className="h-5 w-auto object-contain" />
                            </div>
                          )}
                        </div>
                        <span className="font-bold text-lg whitespace-nowrap text-amber-300">₹{item.price}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {menuData.length === 0 && (
          <div className="text-center py-20 text-zinc-500">
            <div className="text-6xl mb-4">🍽️</div>
            <p className="text-lg">No menu items available.</p>
            <p className="text-sm mt-2">Check back soon for our delicious offerings!</p>
          </div>
        )}
      </div>

      {/* Scroll to Top Button */}
      {categories.length > 0 && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-24 left-6 z-40 bg-amber-500/80 backdrop-blur text-black p-3 rounded-full shadow-lg hover:bg-amber-500 transition-all duration-200"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      )}

      {/* Chatbot Button */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-6 right-6 z-50 bg-amber-500 text-black p-4 rounded-full shadow-lg hover:scale-110 transition-transform duration-300"
      >
        {isChatOpen ? <FaTimes size={24} /> : <FaRobot size={24} />}
      </button>

      {/* Chatbot Component */}
      <Chatbot 
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        menuData={menuData}
        apiBaseUrl={API_BASE_URL}
      />

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes fadeIn { 
          from { opacity: 0; transform: translateY(-10px); } 
          to { opacity: 1; transform: translateY(0); } 
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
      `}</style>
    </div>
  );
}