// src/pages/Dashboard.jsx
import { useState, useEffect } from "react";
import Papa from "papaparse";
import logo from "../assets/logo.png";

// SVG Icons
const EyeIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const EyeOffIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
);

const EditIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const DeleteIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const StarIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const FireIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2c-3.5 0-6 3-6 6 0 2.5 1.5 4.5 3 6-1 1.5-2 3.5-2 6 0 2.5 2 4 4 4s4-1.5 4-4c0-2.5-1-4.5-2-6 1.5-1.5 3-3.5 3-6 0-3-2.5-6-6-6z" />
  </svg>
);

export default function Dashboard() {
  const [items, setItems] = useState([]);
  const [visibleItems, setVisibleItems] = useState(5);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  
  const [editingIndex, setEditingIndex] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newItemData, setNewItemData] = useState({});
  const [filterStatus, setFilterStatus] = useState("all");

  const [menuInfo, setMenuInfo] = useState({
    fileName: "",
    updatedAt: "",
    uploadedAt: "",
    totalItems: 0
  });

  const CORRECT_PASSWORD = "admin123";
  const API_BASE_URL = 'http://localhost:5000/api';

  useEffect(() => {
    const savedAuth = localStorage.getItem("dashboardAuth");
    if (savedAuth === "true") {
      setIsAuthenticated(true);
      loadMenuFromDatabase();
    }
  }, []);

  const loadMenuFromDatabase = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/menu/all`, {
        headers: {
          'Accept': 'application/json; charset=utf-8',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setItems(data || []);
        setMenuInfo(prev => ({
          ...prev,
          totalItems: data.length,
          updatedAt: new Date().toLocaleString()
        }));
      }
    } catch (error) {
      console.error('Error loading menu:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveMenuToDatabase = async (menuItems, fileName) => {
    try {
      setLoading(true);
      
      // Validate data before sending
      if (!menuItems || menuItems.length === 0) {
        console.error('No items to save');
        setUploadStatus("error");
        return false;
      }

      // Prepare data with proper types and ensure all fields are strings
      const itemsToSave = menuItems.map(item => ({
        name: String(item.name || "").trim(),
        category: String(item.category || "Other").trim(),
        price: String(item.price || "0").trim(),
        description: String(item.description || "").trim(),
        available_in: item.available_in ? String(item.available_in).trim() : null,
        strength: item.strength ? String(item.strength).trim() : null,
        hidden: Number(item.hidden) || 0,
        is_special: Number(item.is_special) || 0,
        is_bestseller: Number(item.is_bestseller) || 0
      }));

      console.log('Saving to database:', {
        count: itemsToSave.length,
        sample: itemsToSave[0],
        fileName: fileName
      });

      const response = await fetch(`${API_BASE_URL}/menu/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ items: itemsToSave, fileName: fileName })
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('Server response:', result);
        setUploadStatus("success");
        setTimeout(() => setUploadStatus(""), 3000);
        return true;
      } else {
        const errorText = await response.text();
        console.error('Server error:', response.status, errorText);
        setUploadStatus("error");
        return false;
      }
    } catch (error) {
      console.error('Error saving to database:', error);
      setUploadStatus("error");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (password === CORRECT_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem("dashboardAuth", "true");
      setPasswordError("");
      setPassword("");
      loadMenuFromDatabase();
    } else {
      setPasswordError("Invalid password. Please try again.");
      setPassword("");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("dashboardAuth");
    setPassword("");
    setPasswordError("");
    setItems([]);
  };

  const handleCSVUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadStatus("uploading");
    
    try {
      // Read file as text with proper encoding
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const csvText = event.target.result;
          console.log('CSV Content first 200 chars:', csvText.substring(0, 200));
          
          // Parse CSV with Papa
          const result = Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            trimHeaders: true,
            transformHeader: (header) => header.trim(),
          });

          if (result.errors && result.errors.length > 0) {
            console.error('CSV Parse Errors:', result.errors);
            alert('Error parsing CSV: ' + result.errors[0].message);
            setUploadStatus("error");
            e.target.value = "";
            return;
          }

          console.log('Parsed data sample:', result.data[0]);

          // Transform data
          const itemsWithFlags = result.data
            .filter(row => row.name && row.name.trim())
            .map((item, index) => ({
              id: Date.now() + index,
              name: (item.name || item.Name || "").trim(),
              category: (item.category || item.Category || "Other").trim(),
              price: (item.price || item.Price || "0").toString().trim(),
              description: (item.description || item.Description || "").trim(),
              available_in: item.available_in || item["Available In"] || null,
              strength: item.strength || item.Strength || null,
              hidden: (item.hidden === "true" || item.hidden === "TRUE" || item.hidden === true || item.hidden === 1) ? 1 : 0,
              is_special: (item.is_special === "true" || item.is_special === "TRUE" || item.is_special === "special" || item.is_special === 1) ? 1 : 0,
              is_bestseller: (item.is_bestseller === "true" || item.is_bestseller === "TRUE" || item.is_bestseller === "bestseller" || item.is_bestseller === 1) ? 1 : 0
            }));

          if (itemsWithFlags.length === 0) {
            alert("No valid items found in CSV. Make sure you have a 'name' column.");
            setUploadStatus("error");
            e.target.value = "";
            return;
          }

          console.log('Items to save:', itemsWithFlags.length);

          // Save to database
          const success = await saveMenuToDatabase(itemsWithFlags, file.name);
          
          if (success) {
            await loadMenuFromDatabase();
            setVisibleItems(5);
            
            const now = new Date();
            const formattedDate = now.toLocaleString();
            
            setMenuInfo({
              fileName: file.name,
              updatedAt: formattedDate,
              uploadedAt: formattedDate,
              totalItems: itemsWithFlags.length
            });
            
            alert(`✅ Successfully imported ${itemsWithFlags.length} menu items!`);
          } else {
            alert("❌ Failed to save menu to database. Check console for errors.");
          }
          
          e.target.value = "";
        } catch (error) {
          console.error('Error processing CSV:', error);
          alert('Error processing CSV: ' + error.message);
          setUploadStatus("error");
          e.target.value = "";
        }
      };

      reader.onerror = (error) => {
        console.error('FileReader error:', error);
        alert('Error reading file: ' + error.message);
        setUploadStatus("error");
        e.target.value = "";
      };

      reader.readAsText(file, 'UTF-8');
    } catch (error) {
      console.error('CSV Upload Error:', error);
      alert("Error uploading CSV: " + error.message);
      setUploadStatus("error");
      e.target.value = "";
    }
  };

  const handleToggleSpecial = async (index) => {
    const updatedItems = [...items];
    updatedItems[index].is_special = updatedItems[index].is_special === 1 ? 0 : 1;
    setItems(updatedItems);
    
    const success = await saveMenuToDatabase(updatedItems, menuInfo.fileName);
    if (success) {
      const action = updatedItems[index].is_special === 1 ? "marked as Today's Special" : "removed from Today's Special";
      alert(`Item ${action}!`);
    }
  };

  const handleToggleBestseller = async (index) => {
    const updatedItems = [...items];
    updatedItems[index].is_bestseller = updatedItems[index].is_bestseller === 1 ? 0 : 1;
    setItems(updatedItems);
    
    const success = await saveMenuToDatabase(updatedItems, menuInfo.fileName);
    if (success) {
      const action = updatedItems[index].is_bestseller === 1 ? "marked as Best Seller" : "removed from Best Seller";
      alert(`Item ${action}!`);
    }
  };

  const handleRemoveAllSpecials = async () => {
    if (window.confirm("Remove 'Today's Special' tag from ALL items? This action cannot be undone.")) {
      const updatedItems = items.map(item => ({ ...item, is_special: 0 }));
      setItems(updatedItems);
      
      const success = await saveMenuToDatabase(updatedItems, menuInfo.fileName);
      if (success) {
        alert("✅ Removed 'Today's Special' tag from all items!");
      } else {
        alert("❌ Failed to remove specials.");
      }
    }
  };

  const handleRemoveAllBestsellers = async () => {
    if (window.confirm("Remove 'Best Seller' tag from ALL items? This action cannot be undone.")) {
      const updatedItems = items.map(item => ({ ...item, is_bestseller: 0 }));
      setItems(updatedItems);
      
      const success = await saveMenuToDatabase(updatedItems, menuInfo.fileName);
      if (success) {
        alert("✅ Removed 'Best Seller' tag from all items!");
      } else {
        alert("❌ Failed to remove best sellers.");
      }
    }
  };

  const handleEditClick = (index, item) => {
    setEditingIndex(index);
    setEditFormData({ ...item });
  };

  const handleEditChange = (field, value) => {
    setEditFormData({
      ...editFormData,
      [field]: value,
    });
  };

  const handleSaveEdit = async () => {
    const updatedItems = [...items];
    updatedItems[editingIndex] = editFormData;
    setItems(updatedItems);
    
    const success = await saveMenuToDatabase(updatedItems, menuInfo.fileName);
    
    if (success) {
      setEditingIndex(null);
      setEditFormData({});
      alert("Menu item updated successfully!");
    } else {
      alert("Failed to save changes.");
    }
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditFormData({});
  };

  const handleDeleteItem = async (index) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      const updatedItems = items.filter((_, i) => i !== index);
      setItems(updatedItems);
      
      const success = await saveMenuToDatabase(updatedItems, menuInfo.fileName);
      
      if (success) {
        alert("Item deleted successfully!");
      } else {
        alert("Failed to delete item.");
      }
    }
  };

  const handleToggleHideItem = async (index) => {
    const updatedItems = [...items];
    updatedItems[index].hidden = updatedItems[index].hidden === 1 ? 0 : 1;
    setItems(updatedItems);
    
    const success = await saveMenuToDatabase(updatedItems, menuInfo.fileName);
    
    if (success) {
      const action = updatedItems[index].hidden === 1 ? "hidden from" : "shown on";
      alert(`Item ${action} menu!`);
    } else {
      alert("Failed to update item.");
    }
  };

  const handleHideAllVisible = async () => {
    if (window.confirm("Hide all currently visible items?")) {
      const updatedItems = items.map(item => ({ ...item, hidden: 1 }));
      setItems(updatedItems);
      await saveMenuToDatabase(updatedItems, menuInfo.fileName);
      alert("All items have been hidden from the menu!");
    }
  };

  const handleShowAllHidden = async () => {
    if (window.confirm("Show all hidden items on the menu?")) {
      const updatedItems = items.map(item => ({ ...item, hidden: 0 }));
      setItems(updatedItems);
      await saveMenuToDatabase(updatedItems, menuInfo.fileName);
      alert("All hidden items are now visible on the menu!");
    }
  };

  const getFilteredItems = () => {
    if (filterStatus === "visible") {
      return items.filter(item => item.hidden === 0);
    } else if (filterStatus === "hidden") {
      return items.filter(item => item.hidden === 1);
    }
    return items;
  };

  const handleAddNewItem = () => {
    setIsAddingNew(true);
    const emptyItem = {
      name: "",
      category: "",
      price: "0",
      description: "",
      available_in: null,
      strength: null,
      hidden: 0,
      is_special: 0,
      is_bestseller: 0
    };
    setNewItemData(emptyItem);
  };

  const handleNewItemChange = (field, value) => {
    setNewItemData({
      ...newItemData,
      [field]: value,
    });
  };

  const handleSaveNewItem = async () => {
    if (!newItemData.name) {
      alert("Please fill in the item name!");
      return;
    }

    const updatedItems = [...items, { ...newItemData, id: Date.now() }];
    setItems(updatedItems);
    
    const success = await saveMenuToDatabase(updatedItems, menuInfo.fileName);
    
    if (success) {
      setIsAddingNew(false);
      setNewItemData({});
      alert("New item added successfully!");
    } else {
      alert("Failed to add item.");
    }
  };

  const handleCancelNewItem = () => {
    setIsAddingNew(false);
    setNewItemData({});
  };

  const loadMore = () => {
    setVisibleItems((prev) => Math.min(prev + 5, getFilteredItems().length));
  };

  const showLess = () => {
    setVisibleItems(5);
  };

  const showFullTable = () => {
    setVisibleItems(getFilteredItems().length);
  };

  const handleDeleteMenu = async () => {
    const confirmDelete = window.confirm("Delete the current menu? This cannot be undone.");
    if (!confirmDelete) return;

    const success = await saveMenuToDatabase([], "");
    
    if (success) {
      setItems([]);
      setVisibleItems(5);
      setMenuInfo({
        fileName: "",
        updatedAt: "",
        uploadedAt: "",
        totalItems: 0
      });
      alert("Menu deleted successfully.");
    } else {
      alert("Failed to delete menu.");
    }
  };

  const visibleCount = items.filter(item => item.hidden === 0).length;
  const hiddenCount = items.filter(item => item.hidden === 1).length;
  const specialsCount = items.filter(item => item.is_special === 1).length;
  const bestsellersCount = items.filter(item => item.is_bestseller === 1).length;
  const filteredItems = getFilteredItems();
  const displayedItems = filteredItems.slice(0, visibleItems);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#1C242A] flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-[#2A2A2A] rounded-2xl shadow-xl p-8 border border-white/10">
          <img src={logo} alt="Café Élan" className="mx-auto h-24 md:h-32 w-auto object-contain mb-6" />
          <h1 className="text-2xl font-bold text-center mb-6 text-amber-500">Admin Access Required</h1>
          
          <form onSubmit={handlePasswordSubmit}>
            <label className="block mb-3 text-lg font-semibold text-white">
              Enter Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-white/20 bg-[#1C242A] p-3 text-white mb-4 focus:outline-none focus:border-amber-500"
              placeholder="Enter admin password"
              autoFocus
            />
            {passwordError && (
              <p className="text-red-400 mb-4 text-sm">{passwordError}</p>
            )}
            <button
              type="submit"
              className="w-full rounded-xl bg-amber-500 px-5 py-2 font-semibold text-black transition hover:bg-amber-400"
            >
              Access Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1C242A] p-8">
      <div className="max-w-7xl mx-auto bg-[#2A2A2A] rounded-2xl shadow-xl p-8 border border-white/10">
        {/* Logo and Logout Button */}
        <div className="flex justify-between items-center mb-4">
          <img src={logo} alt="Café Élan" className="h-16 md:h-20 w-auto object-contain" />
          <button
            onClick={handleLogout}
            className="rounded-xl border border-red-500 px-4 py-2 text-red-400 transition hover:bg-red-500/10 text-sm font-semibold"
          >
            Logout
          </button>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-center mt-2 mb-8 text-amber-500">
          Dashboard
        </h1>

        {/* Upload Section */}
        <div className="mb-8">
          <label className="block mb-3 text-lg font-semibold text-white">
            Upload Menu CSV to Database
          </label>
          
          <div className="flex gap-4 items-center flex-wrap">
            <input
              type="file"
              accept=".csv"
              onChange={handleCSVUpload}
              disabled={loading}
              className="block w-full md:w-auto rounded-xl border border-white/20 bg-[#1C242A] p-3 text-white file:mr-4 file:rounded-lg file:border-0 file:bg-amber-500 file:px-4 file:py-2 file:font-semibold file:text-black hover:file:bg-amber-400 disabled:opacity-50"
            />
            
            {uploadStatus === "uploading" && (
              <div className="flex items-center gap-2 text-amber-500">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-amber-500"></div>
                <span>Uploading...</span>
              </div>
            )}
            
            {uploadStatus === "success" && (
              <div className="text-green-500">✓ Upload successful!</div>
            )}
            
            {uploadStatus === "error" && (
              <div className="text-red-500">✗ Upload failed.</div>
            )}
          </div>
          
          <p className="text-xs text-gray-400 mt-2">
            CSV columns: name, category, price, description, available_in, strength, hidden, is_special, is_bestseller
          </p>
          <p className="text-xs text-gray-400 mt-1">
            ⚠️ Save CSV with UTF-8 encoding to preserve special characters (é, ñ, etc.)
          </p>
        </div>

        {/* Current Active Menu */}
        {menuInfo.fileName && (
          <div className="mb-8 rounded-2xl border border-white/10 bg-[#1C242A] p-6">
            <h2 className="mb-5 text-xl font-semibold text-amber-500">
              Current Active Menu
            </h2>
            <div className="space-y-3 text-white">
              <p><span className="font-semibold text-gray-400">📄 File Name:</span> {menuInfo.fileName}</p>
              <p><span className="font-semibold text-gray-400">🕒 Last Uploaded:</span> {menuInfo.uploadedAt}</p>
              <p><span className="font-semibold text-gray-400">✏️ Last Updated:</span> {menuInfo.updatedAt}</p>
              <p><span className="font-semibold text-gray-400">🍽️ Total Items:</span> {items.length}</p>
              <p><span className="font-semibold text-gray-400">👁️ Visible Items:</span> {visibleCount}</p>
              <p><span className="font-semibold text-gray-400">🙈 Hidden Items:</span> {hiddenCount}</p>
              <p><span className="font-semibold text-gray-400">⭐ Today's Specials:</span> {specialsCount}</p>
              <p><span className="font-semibold text-gray-400">🔥 Best Sellers:</span> {bestsellersCount}</p>
            </div>
            
            {/* Bulk Actions */}
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={handleHideAllVisible}
                className="rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Hide All Visible Items
              </button>
              <button
                onClick={handleShowAllHidden}
                className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Show All Hidden Items
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={handleRemoveAllSpecials}
                className="rounded-xl bg-yellow-600/80 px-4 py-2 text-sm font-semibold text-white transition hover:bg-yellow-600 flex items-center gap-2"
              >
                <StarIcon /> Remove All Specials
              </button>
              <button
                onClick={handleRemoveAllBestsellers}
                className="rounded-xl bg-red-600/80 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600 flex items-center gap-2"
              >
                <FireIcon /> Remove All Best Sellers
              </button>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={loadMenuFromDatabase} className="rounded-xl bg-amber-500 px-5 py-2 font-semibold text-black transition hover:opacity-90">
                Refresh Menu
              </button>
              <button onClick={handleDeleteMenu} className="rounded-xl border border-red-500 px-5 py-2 font-semibold text-red-400 transition hover:bg-red-500/10">
                Delete Menu
              </button>
            </div>
          </div>
        )}

        {/* Filter Controls */}
        {items.length > 0 && (
          <div className="mb-6 rounded-xl bg-[#1C242A] p-4">
            <h3 className="text-sm font-semibold text-white mb-3">Filter by Visibility:</h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => { setFilterStatus("all"); setVisibleItems(5); }}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  filterStatus === "all" 
                    ? "bg-amber-500 text-black" 
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                📋 Show All ({items.length})
              </button>
              <button
                onClick={() => { setFilterStatus("visible"); setVisibleItems(5); }}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  filterStatus === "visible" 
                    ? "bg-green-600 text-white" 
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                👁️ Visible Only ({visibleCount})
              </button>
              <button
                onClick={() => { setFilterStatus("hidden"); setVisibleItems(5); }}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  filterStatus === "hidden" 
                    ? "bg-orange-600 text-white" 
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                🙈 Hidden Only ({hiddenCount})
              </button>
            </div>
          </div>
        )}

        {/* Add New Item Button */}
        {items.length > 0 && !isAddingNew && (
          <div className="mb-6">
            <button
              onClick={handleAddNewItem}
              className="rounded-xl bg-green-600 px-6 py-2 font-semibold text-white transition hover:opacity-90"
            >
              + Add New Menu Item
            </button>
          </div>
        )}

        {/* Add New Item Form */}
        {isAddingNew && (
          <div className="mb-8 rounded-2xl border-2 border-amber-500 bg-[#1C242A] p-6">
            <h3 className="text-lg font-semibold text-amber-500 mb-4">Add New Menu Item</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block mb-2 text-sm font-semibold text-white">Name *</label>
                <input
                  type="text"
                  value={newItemData.name || ""}
                  onChange={(e) => handleNewItemChange("name", e.target.value)}
                  className="w-full rounded-lg border border-white/20 bg-[#1C242A] p-2 text-white"
                  placeholder="Enter name"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-semibold text-white">Category</label>
                <input
                  type="text"
                  value={newItemData.category || ""}
                  onChange={(e) => handleNewItemChange("category", e.target.value)}
                  className="w-full rounded-lg border border-white/20 bg-[#1C242A] p-2 text-white"
                  placeholder="Enter category"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-semibold text-white">Price</label>
                <input
                  type="text"
                  value={newItemData.price || ""}
                  onChange={(e) => handleNewItemChange("price", e.target.value)}
                  className="w-full rounded-lg border border-white/20 bg-[#1C242A] p-2 text-white"
                  placeholder="Enter price (e.g., 119/149/199)"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-semibold text-white">Description</label>
                <input
                  type="text"
                  value={newItemData.description || ""}
                  onChange={(e) => handleNewItemChange("description", e.target.value)}
                  className="w-full rounded-lg border border-white/20 bg-[#1C242A] p-2 text-white"
                  placeholder="Enter description"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleSaveNewItem} className="rounded-lg bg-green-600 px-4 py-2 text-white font-semibold hover:opacity-90">
                Save Item
              </button>
              <button onClick={handleCancelNewItem} className="rounded-lg border border-gray-500 px-4 py-2 text-white font-semibold hover:bg-white/5">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[#2A2A2A] rounded-lg p-6 border border-white/10">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
              <p className="mt-4 text-white">Saving...</p>
            </div>
          </div>
        )}

        {/* Preview Table */}
        {filteredItems.length > 0 ? (
          <>
            <h2 className="text-xl font-semibold mb-4 text-amber-500">
              Menu Preview ({filteredItems.length} Items)
              {filterStatus !== "all" && (
                <span className="text-sm ml-2 text-gray-400">
                  ({filterStatus === "visible" ? "Visible only" : "Hidden only"})
                </span>
              )}
            </h2>
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#1C242A]">
                    <th className="border-b border-white/10 p-3 text-left text-white">#</th>
                    <th className="border-b border-white/10 p-3 text-left text-white">Name</th>
                    <th className="border-b border-white/10 p-3 text-left text-white">Category</th>
                    <th className="border-b border-white/10 p-3 text-left text-white">Price</th>
                    <th className="border-b border-white/10 p-3 text-left text-white">Description</th>
                    <th className="border-b border-white/10 p-3 text-left text-white">Badges</th>
                    <th className="border-b border-white/10 p-3 text-left text-white">Status</th>
                    <th className="border-b border-white/10 p-3 text-left text-white">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedItems.map((row, idx) => {
                    const originalIndex = items.findIndex(item => item.id === row.id);
                    const displayNumber = idx + 1;
                    return (
                      <tr key={row.id || idx} className={`hover:bg-white/5 transition-colors ${row.hidden === 1 ? 'opacity-60 bg-red-500/5' : ''}`}>
                        {editingIndex === originalIndex ? (
                          <>
                            <td className="border-b border-white/5 p-3 text-center text-gray-400">{displayNumber}</td>
                            <td className="border-b border-white/5 p-3">
                              <input 
                                type="text" 
                                value={editFormData.name || ""} 
                                onChange={(e) => handleEditChange("name", e.target.value)} 
                                className="w-full rounded bg-[#1C242A] border border-white/10 p-2 text-white" 
                                placeholder="Supports é, ñ, etc."
                              />
                            </td>
                            <td className="border-b border-white/5 p-3">
                              <input type="text" value={editFormData.category || ""} onChange={(e) => handleEditChange("category", e.target.value)} className="w-full rounded bg-[#1C242A] border border-white/10 p-2 text-white" />
                            </td>
                            <td className="border-b border-white/5 p-3">
                              <input type="text" value={editFormData.price || ""} onChange={(e) => handleEditChange("price", e.target.value)} className="w-full rounded bg-[#1C242A] border border-white/10 p-2 text-white" placeholder="e.g., 119/149/199" />
                            </td>
                            <td className="border-b border-white/5 p-3">
                              <input type="text" value={editFormData.description || ""} onChange={(e) => handleEditChange("description", e.target.value)} className="w-full rounded bg-[#1C242A] border border-white/10 p-2 text-white" />
                            </td>
                            <td className="border-b border-white/5 p-3">
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleEditChange("is_special", editFormData.is_special === 1 ? 0 : 1)}
                                  className={`px-2 py-1 rounded text-xs ${editFormData.is_special === 1 ? 'bg-yellow-600 text-white' : 'bg-gray-600 text-gray-300'}`}
                                >
                                  {editFormData.is_special === 1 ? '⭐ Special' : 'Set Special'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleEditChange("is_bestseller", editFormData.is_bestseller === 1 ? 0 : 1)}
                                  className={`px-2 py-1 rounded text-xs ${editFormData.is_bestseller === 1 ? 'bg-red-600 text-white' : 'bg-gray-600 text-gray-300'}`}
                                >
                                  {editFormData.is_bestseller === 1 ? '🔥 Best Seller' : 'Set Best Seller'}
                                </button>
                              </div>
                            </td>
                            <td className="border-b border-white/5 p-3">
                              <span className={`px-2 py-1 rounded-full text-xs ${row.hidden === 1 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                                {row.hidden === 1 ? 'Hidden' : 'Visible'}
                              </span>
                            </td>
                            <td className="border-b border-white/5 p-3">
                              <div className="flex gap-2">
                                <button onClick={handleSaveEdit} className="rounded bg-green-600 px-3 py-1 text-sm text-white">Save</button>
                                <button onClick={handleCancelEdit} className="rounded bg-gray-600 px-3 py-1 text-sm text-white">Cancel</button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="border-b border-white/5 p-3 text-center text-gray-400 text-sm">{displayNumber}</td>
                            <td className="border-b border-white/5 p-3 text-white font-medium">{row.name}</td>
                            <td className="border-b border-white/5 p-3 text-white">{row.category}</td>
                            <td className="border-b border-white/5 p-3 text-white font-semibold text-amber-500">
                              ₹{row.price}
                            </td>
                            <td className="border-b border-white/5 p-3 text-white text-sm">{row.description || '-'}</td>
                            <td className="border-b border-white/5 p-3">
                              <div className="flex gap-1 flex-wrap">
                                {row.is_special === 1 && (
                                  <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-600 text-white flex items-center gap-1">
                                    <StarIcon /> Special
                                  </span>
                                )}
                                {row.is_bestseller === 1 && (
                                  <span className="px-2 py-0.5 rounded-full text-xs bg-red-600 text-white flex items-center gap-1">
                                    <FireIcon /> Best Seller
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="border-b border-white/5 p-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.hidden === 1 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                                {row.hidden === 1 ? 'Hidden' : 'Visible'}
                              </span>
                            </td>
                            <td className="border-b border-white/5 p-3">
                              <div className="flex gap-1 items-center flex-wrap">
                                <button
                                  onClick={() => handleToggleSpecial(originalIndex)}
                                  className={`p-1.5 rounded transition hover:scale-110 ${row.is_special === 1 ? 'text-yellow-500' : 'text-gray-500'}`}
                                  title="Toggle Today's Special"
                                >
                                  <StarIcon />
                                </button>
                                <button
                                  onClick={() => handleToggleBestseller(originalIndex)}
                                  className={`p-1.5 rounded transition hover:scale-110 ${row.is_bestseller === 1 ? 'text-red-500' : 'text-gray-500'}`}
                                  title="Toggle Best Seller"
                                >
                                  <FireIcon />
                                </button>
                                <button onClick={() => handleToggleHideItem(originalIndex)} className="transition hover:scale-110" title={row.hidden === 1 ? "Show on Menu" : "Hide from Menu"}>
                                  {row.hidden === 1 ? <div className="text-green-500"><EyeIcon /></div> : <div className="text-orange-500"><EyeOffIcon /></div>}
                                </button>
                                <button onClick={() => handleEditClick(originalIndex, row)} className="text-blue-500 transition hover:scale-110" title="Edit Item">
                                  <EditIcon />
                                </button>
                                <button onClick={() => handleDeleteItem(originalIndex)} className="text-red-500 transition hover:scale-110" title="Delete Item">
                                  <DeleteIcon />
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Load More / Show Less / Show Full Table */}
            <div className="mt-6 flex flex-col items-center gap-3">
              <p className="text-sm text-gray-400">
                Showing {Math.min(visibleItems, filteredItems.length)} of {filteredItems.length} menu items
              </p>
              <div className="flex gap-3 flex-wrap justify-center">
                {visibleItems < filteredItems.length && (
                  <button onClick={loadMore} className="rounded-xl bg-amber-500 px-6 py-2 font-semibold text-black transition hover:opacity-90">
                    Load More (+5)
                  </button>
                )}
                {visibleItems < filteredItems.length && (
                  <button onClick={showFullTable} className="rounded-xl bg-blue-600 px-6 py-2 font-semibold text-white transition hover:opacity-90">
                    Show Full Table ({filteredItems.length})
                  </button>
                )}
                {visibleItems > 5 && visibleItems < filteredItems.length && (
                  <button onClick={showLess} className="rounded-xl border border-white/20 px-6 py-2 text-white transition hover:bg-white/5">
                    Show Less
                  </button>
                )}
                {visibleItems === filteredItems.length && filteredItems.length > 5 && (
                  <button onClick={showLess} className="rounded-xl border border-white/20 px-6 py-2 text-white transition hover:bg-white/5">
                    Reset to 5
                  </button>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/20 py-16 text-center text-gray-400">
            No menu uploaded yet. Upload a CSV file to get started.
          </div>
        )}
      </div>
    </div>
  );
}