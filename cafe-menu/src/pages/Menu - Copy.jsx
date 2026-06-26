import { useEffect, useState } from "react";
import { FaSearch, FaChevronDown } from "react-icons/fa";
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

export default function Menu() {
  const [menuData, setMenuData] = useState([]);
  const [openCategory, setOpenCategory] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const menuFiles = JSON.parse(
      localStorage.getItem("menuFiles") || "[]"
    );
  
    const activeMenu = menuFiles.find(
      (menu) => menu.active
    );
  
    if (activeMenu) {
      setMenuData(activeMenu.items);
    } else {
      // Fallback for old storage format
      const fallback = localStorage.getItem("menuData");
  
      if (fallback) {
        setMenuData(JSON.parse(fallback));
      }
    }
  }, []);

  const filtered = menuData.filter(
    (item) =>
      item.name?.toLowerCase().includes(search.toLowerCase()) ||
      item.category?.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = filtered.reduce((acc, item) => {
    const category = item.category || "Others";
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-cafe-dark text-cafe-accent-y">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-72 h-72 bg-cafe rounded-full blur-3xl" />

        <div className="relative text-center py-12 px-6">
        <img
          src="./src/assets/logo.png"
          alt="Café Élan"
          className="mx-auto h-24 md:h-32 w-auto object-contain"
        />

          <p className="mt-3 text-cafe-accent-d">
            Made for the moments that matter.
          </p>
        </div>
      </div>

      {/* Search */}
          <div className="sticky top-0 z-30 pt-4 px-4 pb-4 backdrop-blur-xl bg-gradient-to-b from-cafe-dark via-cafe/70 to-transparent">
              <div className="max-w-3xl mx-auto flex items-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-full px-5 py-3">
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

          {/* Category Chips */}
          <div className="max-w-3xl mx-auto px-4 mb-6">
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                  {Object.keys(grouped).map((cat) => (
                      <button
                          key={cat}
                          onClick={() => setOpenCategory(cat)}
                          className="px-4 py-2 rounded-full bg-white/5 border border-white/10 whitespace-nowrap hover:bg-amber-500/20 transition"
                      >
                          {cat}
                      </button>
                  ))}
              </div>
          </div>

      {/* Categories */}
      <div className="max-w-3xl mx-auto p-6 px-7 pb-10 space-y-5">
        {Object.entries(grouped).map(([category, items]) => {
          const isOpen = openCategory === category;

          return (
            <div
              key={category}
              className="rounded-3xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-xl"
            >
              <button
                className="w-full flex justify-between items-center px-6 py-5"
                onClick={() =>
                  setOpenCategory(isOpen ? "" : category)
                }
              >
                <div className="text-left">
                  <h2 className="text-2xl font-semibold">
                    {category}
                  </h2>
                  <p className="text-sm text-cafe-accent-d">
                    {items.length} items
                  </p>
                </div>

                <FaChevronDown
                  className={`transition-transform duration-300 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              <div
                className={`grid transition-all duration-300 ${
                  isOpen
                    ? "grid-rows-[1fr]"
                    : "grid-rows-[0fr]"
                }`}
              >
                <div className="overflow-hidden">
                  <div className="px-4 pb-4 space-y-3">
                    {items.map((item, index) => (
                      <div
                        key={index}
                        className="group rounded-2xl p-4 bg-black/20 border border-white/5 hover:border-amber-400/30 hover:bg-white/10 transition-all duration-300"
                      >
                        <div className="flex justify-between items-start gap-4">
                        <div>
                          <h3 className="text-lg font-medium group-hover:text-amber-300 transition-colors">
                            {item.name}
                          </h3>

                          {item.description && (
                            <p className="text-sm text-cafe-accent-d mt-1">
                              {item.description}
                            </p>
                          )}

                          {item.availableIn && (
                            <p className="text-xs text-cafe-accent mt-2 tracking-wide uppercase">
                              Available in: {item.availableIn}
                            </p>
                          )}

                          {item.strength && strengthIcons[item.strength] && (
                            <div className="mt-2 flex items-center gap-2">
                              <span className="text-xs text-cafe-accent-d uppercase tracking-wider">
                                Taste Profile
                              </span>
                              <img
                                src={strengthIcons[item.strength]}
                                alt={item.strength}
                                className="h-5 w-auto object-contain"
                              />
                            </div>
                          )}
                        </div>

                          <span className="font-bold text-lg whitespace-nowrap text-amber-300">
                            ₹{item.price}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {!menuData.length && (
          <div className="text-center py-20 text-zinc-500">
            No menu items available.
          </div>
        )}
      </div>
    </div>
  );
}