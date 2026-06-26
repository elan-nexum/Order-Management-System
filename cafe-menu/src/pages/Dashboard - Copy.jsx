import { useState, useEffect } from "react";
import Papa from "papaparse";
import logo from "../assets/logo.png";

export default function Dashboard() {
  const [items, setItems] = useState([]);
  const [visibleItems, setVisibleItems] = useState(5);

  const [menuInfo, setMenuInfo] = useState({
    fileName: "",
    updatedAt: "",
    uploadedAt: "",
  });

  // Load saved menu on page load
  useEffect(() => {
    const savedMenu = localStorage.getItem("menuData");
    const savedFileName =
      localStorage.getItem("menuFileName") || "";
    const savedUpdatedAt =
      localStorage.getItem("menuUpdatedAt") || "";
    const savedUploadedAt =
      localStorage.getItem("menuUploadedAt") || "";

    if (savedMenu) {
      setItems(JSON.parse(savedMenu));
    }

    setMenuInfo({
      fileName: savedFileName,
      updatedAt: savedUpdatedAt,
      uploadedAt: savedUploadedAt,
    });
  }, []);

  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        setItems(result.data);
        setVisibleItems(5);

        // Generate timestamp
        const now = new Date();
        const formattedDate = now.toLocaleString();

        // Save menu data
        localStorage.setItem(
          "menuData",
          JSON.stringify(result.data)
        );

        // Save metadata
        localStorage.setItem(
          "menuFileName",
          file.name
        );
        localStorage.setItem(
          "menuUpdatedAt",
          formattedDate
        );
        localStorage.setItem(
          "menuUploadedAt",
          formattedDate
        );

        setMenuInfo({
          fileName: file.name,
          updatedAt: formattedDate,
          uploadedAt: formattedDate,
        });

        alert(
          `Imported ${result.data.length} menu items successfully!`
        );

        // Reset file input
        e.target.value = "";
      },
    });
  };

  const loadMore = () => {
    setVisibleItems((prev) =>
      Math.min(prev + 5, items.length)
    );
  };

  const showLess = () => {
    setVisibleItems(5);
  };

  const handleDeleteMenu = () => {
    const confirmDelete = window.confirm(
      "Delete the current menu? This cannot be undone."
    );

    if (!confirmDelete) return;

    localStorage.removeItem("menuData");
    localStorage.removeItem("menuFileName");
    localStorage.removeItem("menuUpdatedAt");
    localStorage.removeItem("menuUploadedAt");

    setItems([]);
    setVisibleItems(5);

    setMenuInfo({
      fileName: "",
      updatedAt: "",
      uploadedAt: "",
    });

    alert("Menu deleted successfully.");
  };

  const handleShowMenu = () => {
    const savedMenu = localStorage.getItem("menuData");
    if (savedMenu) {
      setItems(JSON.parse(savedMenu));
    }
  };

  return (
    <div className="min-h-screen bg-cafe-dark p-8">
      <div className="max-w-5xl mx-auto bg-cafe rounded-2xl shadow-xl p-8">
        {/* Logo */}
        <img
          src={logo}
          alt="Café Élan"
          className="mx-auto h-24 md:h-32 w-auto object-contain"
        />

        {/* Title */}
        <h1 className="text-3xl font-bold text-center mt-6 mb-8 text-cafe-accent-y">
          Dashboard
        </h1>

        {/* Upload */}
        <div className="mb-8">
          <label className="block mb-3 text-lg font-semibold text-cafe-accent-l">
            Upload Menu CSV
          </label>

          <input
            type="file"
            accept=".csv"
            onChange={handleCSVUpload}
            className="block w-full rounded-xl border border-cafe-accent/20 bg-cafe-dark p-3 text-cafe-accent-l file:mr-4 file:rounded-lg file:border-0 file:bg-cafe-accent-y file:px-4 file:py-2 file:font-semibold file:text-black hover:file:opacity-90"
          />
        </div>

        {/* Current Active Menu */}
        {menuInfo.fileName && (
          <div className="mb-8 rounded-2xl border border-cafe-accent/20 bg-cafe-dark p-6">
            <h2 className="mb-5 text-xl font-semibold text-cafe-accent-y">
              Current Active Menu
            </h2>

            <div className="space-y-3 text-cafe-accent-l">
              <p>
                <span className="font-semibold">
                  📄 File Name:
                </span>{" "}
                {menuInfo.fileName}
              </p>

              <p>
                <span className="font-semibold">
                  🕒 Last Uploaded:
                </span>{" "}
                {menuInfo.uploadedAt}
              </p>

              <p>
                <span className="font-semibold">
                  ✏️ Last Updated:
                </span>{" "}
                {menuInfo.updatedAt}
              </p>

              <p>
                <span className="font-semibold">
                  🍽️ Total Items:
                </span>{" "}
                {items.length}
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={handleShowMenu}
                className="rounded-xl bg-cafe-accent-y px-5 py-2 font-semibold text-black transition hover:opacity-90"
              >
                Show Menu
              </button>

              <button
                onClick={handleDeleteMenu}
                className="rounded-xl border border-red-500 px-5 py-2 font-semibold text-red-400 transition hover:bg-red-500/10"
              >
                Delete Menu
              </button>
            </div>
          </div>
        )}

        {/* Preview */}
        {items.length > 0 ? (
          <>
            <h2 className="text-xl font-semibold mb-4 text-cafe-accent-y">
              Menu Preview ({items.length} Items)
            </h2>

            <div className="overflow-x-auto rounded-xl border border-cafe-accent/20">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-cafe-dark">
                    {Object.keys(items[0]).map((key) => (
                      <th
                        key={key}
                        className="border-b border-cafe-accent/20 p-3 text-left text-cafe-accent-l whitespace-nowrap"
                      >
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {items
                    .slice(0, visibleItems)
                    .map((row, rowIndex) => (
                      <tr
                        key={rowIndex}
                        className="hover:bg-white/5 transition-colors"
                      >
                        {Object.values(row).map(
                          (value, colIndex) => (
                            <td
                              key={colIndex}
                              className="border-b border-cafe-accent/10 p-3 text-cafe-accent-l whitespace-nowrap"
                            >
                              {value}
                            </td>
                          )
                        )}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Load More / Show Less */}
            <div className="mt-6 flex flex-col items-center gap-3">
              <p className="text-sm text-cafe-accent-d">
                Showing{" "}
                {Math.min(
                  visibleItems,
                  items.length
                )}{" "}
                of {items.length} menu items
              </p>

              <div className="flex gap-3">
                {visibleItems < items.length && (
                  <button
                    onClick={loadMore}
                    className="rounded-xl bg-cafe-accent-y px-6 py-2 font-semibold text-black transition hover:opacity-90"
                  >
                    Load More
                  </button>
                )}

                {visibleItems > 5 && (
                  <button
                    onClick={showLess}
                    className="rounded-xl border border-cafe-accent/20 px-6 py-2 text-cafe-accent-l transition hover:bg-white/5"
                  >
                    Show Less
                  </button>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-cafe-accent/20 py-16 text-center text-cafe-accent-d">
            No menu uploaded yet. Upload a CSV file to get started.
          </div>
        )}
      </div>
    </div>
  );
}