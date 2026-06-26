// ServiceStaff.jsx - with separate Kitchen and Beverage KOT
import React, { useState, useEffect, useRef } from "react";
import { 
  FaPlus, FaMinus, FaTrash, FaPrint, FaReceipt, FaUser, FaUsers, 
  FaSearch, FaSave, FaClock, FaHistory, FaChevronDown, FaFileInvoice, 
  FaUtensils, FaCoffee, FaChevronLeft, FaChevronRight, FaHome, FaHotel,
  FaShoppingBag, FaTruck, FaExclamationTriangle, FaLock, FaUnlock,
  FaEdit, FaExchangeAlt, FaArrowRight, FaClipboardList, FaSync,
  FaCopy, FaPrint as FaPrintIcon, FaGlassCheers
} from "react-icons/fa";
import logo from "../assets/logo.png";

const ServiceStaff = () => {
  const [menuData, setMenuData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tableNumber, setTableNumber] = useState("");
  const [numberOfGuests, setNumberOfGuests] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [cart, setCart] = useState([]);
  const [orderNote, setOrderNote] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [staffName, setStaffName] = useState("");
  const [savedOrders, setSavedOrders] = useState([]);
  const [showSavedOrders, setShowSavedOrders] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [showTableDropdown, setShowTableDropdown] = useState(false);
  const [filteredTables, setFilteredTables] = useState([]);
  const [isNewOrder, setIsNewOrder] = useState(true);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [processedMenuData, setProcessedMenuData] = useState([]);
  const [orderType, setOrderType] = useState("dine-in");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [showAddressInput, setShowAddressInput] = useState(false);
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [isOrderLocked, setIsOrderLocked] = useState(false);
  const [lockedOrderId, setLockedOrderId] = useState(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferFromTable, setTransferFromTable] = useState("");
  const [transferToTable, setTransferToTable] = useState("");
  const [transferOrder, setTransferOrder] = useState(null);
  const [activeLockedOrder, setActiveLockedOrder] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [existingOrderItems, setExistingOrderItems] = useState([]);
  const [showExistingItems, setShowExistingItems] = useState(false);
  const [showKOTModal, setShowKOTModal] = useState(false);
  const [kotData, setKotData] = useState(null);
  const [kotType, setKotType] = useState("kitchen"); // "kitchen" or "beverage"
  
  const categoriesScrollRef = useRef(null);
  const API_BASE_URL = 'http://localhost:5000/api';
  const NON_KOT_CATEGORIES = ['Hot Beverages', 'Cold Beverages', 'Shakes', 'Lassi'];
  const BEVERAGE_CATEGORIES = ['Hot Beverages', 'Cold Beverages', 'Shakes', 'Lassi'];
  const KITCHEN_CATEGORIES = ['Starters', 'Main Course', 'Biryani', 'Tandoor', 'Bread', 'Rice', 'Noodles', 'Curries', 'Soups'];
  const TABLE_COUNT = 17;

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

  // Function to split items with "/" in price or description
  const splitMenuItem = (item) => {
    const results = [];
    
    if (item.price && item.price.includes('/')) {
      const prices = item.price.split('/').map(p => p.trim());
      
      let sizes = [];
      if (item.description && item.description.includes('/')) {
        const descParts = item.description.split('/').map(p => p.trim());
        if (descParts.length === prices.length) {
          sizes = descParts;
        } else {
          const sizeMatch = item.description.match(/(\d+pc|\d+\s?pc)/gi);
          if (sizeMatch && sizeMatch.length === prices.length) {
            sizes = sizeMatch;
          } else {
            sizes = prices.map((_, i) => `Option ${i + 1}`);
          }
        }
      } else {
        sizes = prices.map((_, i) => `Option ${i + 1}`);
      }

      prices.forEach((price, index) => {
        const sizeLabel = sizes[index] || `Option ${index + 1}`;
        const name = `${item.name} (${sizeLabel})`;
        results.push({
          ...item,
          id: `${item.id}-${index}`,
          name: name,
          price: price,
          originalId: item.id,
          originalName: item.name,
          size: sizeLabel,
          isVariant: true,
          variantIndex: index
        });
      });
    } else {
      results.push({
        ...item,
        isVariant: false
      });
    }
    
    return results;
  };

  const processMenuItems = (items) => {
    const processed = [];
    items.forEach(item => {
      const splitItems = splitMenuItem(item);
      processed.push(...splitItems);
    });
    return processed;
  };

  // Add scroll event listener
  useEffect(() => {
    const scrollContainer = categoriesScrollRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', checkScrollPosition);
      checkScrollPosition();
      return () => scrollContainer.removeEventListener('scroll', checkScrollPosition);
    }
  }, [processedMenuData]);

  useEffect(() => {
    const initialize = async () => {
      await loadMenuData();
      const savedStaff = localStorage.getItem("staffName") || "";
      setStaffName(savedStaff);
      await loadSavedOrdersFromServer();
      
      const continueOrderId = localStorage.getItem("continueOrderId");
      if (continueOrderId) {
        const saved = localStorage.getItem("savedOrders");
        if (saved) {
          try {
            const orders = JSON.parse(saved);
            const orderToContinue = orders.find(o => o.id === parseInt(continueOrderId) && o.status === "draft");
            if (orderToContinue) {
              setTimeout(() => {
                loadSavedOrder(orderToContinue);
                localStorage.removeItem("continueOrderId");
              }, 300);
            }
          } catch (e) {
            console.error('Error loading continue order:', e);
          }
        }
      }
    };
    initialize();
  }, []);

  const loadMenuData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/menu`);
      if (response.ok) {
        const data = await response.json();
        const visibleItems = data.filter(item => item.hidden === 0);
        setMenuData(visibleItems || []);
        
        const processed = processMenuItems(visibleItems || []);
        setProcessedMenuData(processed);
        
        if (processed && processed.length > 0) {
          const cats = [...new Set(processed.map(item => item.category || "Others"))];
          setSelectedCategory(cats[0] || "");
        }
      }
    } catch (error) {
      console.error('Error loading menu:', error);
      setMenuData([]);
      setProcessedMenuData([]);
    } finally {
      setLoading(false);
    }
  };

  // Load saved orders from server
  const loadSavedOrdersFromServer = async () => {
    try {
      setSyncing(true);
      const response = await fetch(`${API_BASE_URL}/orders`);
      if (response.ok) {
        const serverOrders = await response.json();
        // Filter only draft orders
        const draftOrders = serverOrders.filter(o => o.status === "draft");
        
        // Also load from localStorage for local drafts
        const localSaved = localStorage.getItem("savedOrders");
        let localDrafts = [];
        if (localSaved) {
          const localOrders = JSON.parse(localSaved);
          localDrafts = localOrders.filter(o => o.status === "draft");
        }
        
        // Combine server and local drafts (avoid duplicates by id)
        const allDrafts = [...draftOrders];
        localDrafts.forEach(localOrder => {
          if (!allDrafts.some(o => o.id === localOrder.id)) {
            allDrafts.push(localOrder);
          }
        });
        
        setSavedOrders(allDrafts);
        setFilteredTables(allDrafts);
        
        // Also save to localStorage for offline access
        localStorage.setItem("savedOrders", JSON.stringify(allDrafts));
      } else {
        // Fallback to localStorage only
        const saved = localStorage.getItem("savedOrders");
        if (saved) {
          const orders = JSON.parse(saved);
          const drafts = orders.filter(o => o.status === "draft");
          setSavedOrders(drafts);
          setFilteredTables(drafts);
        } else {
          setSavedOrders([]);
          setFilteredTables([]);
        }
      }
    } catch (error) {
      console.error('Error loading saved orders from server:', error);
      // Fallback to localStorage
      const saved = localStorage.getItem("savedOrders");
      if (saved) {
        const orders = JSON.parse(saved);
        const drafts = orders.filter(o => o.status === "draft");
        setSavedOrders(drafts);
        setFilteredTables(drafts);
      } else {
        setSavedOrders([]);
        setFilteredTables([]);
      }
    } finally {
      setSyncing(false);
    }
  };

  // Save orders to server and localStorage
  const saveOrdersToServer = async (orders) => {
    try {
      setSyncing(true);
      // Save to localStorage first
      localStorage.setItem("savedOrders", JSON.stringify(orders));
      setSavedOrders(orders);
      const drafts = orders.filter(o => o.status === "draft");
      setFilteredTables(drafts);
      
      // Sync with server
      const draftOrders = orders.filter(o => o.status === "draft");
      for (const order of draftOrders) {
        try {
          // Check if order exists on server
          const checkResponse = await fetch(`${API_BASE_URL}/orders`);
          if (checkResponse.ok) {
            const serverOrders = await checkResponse.json();
            const exists = serverOrders.some(o => o.id === order.id);
            
            if (exists) {
              // Update existing order
              await fetch(`${API_BASE_URL}/orders/${order.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(order)
              });
            } else {
              // Create new order
              await fetch(`${API_BASE_URL}/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(order)
              });
            }
          }
        } catch (error) {
          console.error('Error syncing order with server:', error);
        }
      }
    } catch (error) {
      console.error('Error saving orders:', error);
    } finally {
      setSyncing(false);
    }
  };

  const isBeverageCategory = (category) => {
    return category && BEVERAGE_CATEGORIES.includes(category);
  };

  const isKitchenCategory = (category) => {
    return category && KITCHEN_CATEGORIES.includes(category);
  };

  const needsKOT = (item) => {
    if (!item || !item.category) return false;
    // Exclude Saleables, Addons, Cigarettes
    const excludedCategories = ['Saleables', 'Addons', 'Cigarettes', 'Others'];
    if (excludedCategories.includes(item.category)) return false;
    return true;
  };

  const getFilteredItems = () => {
    let items = processedMenuData || [];
    
    if (searchTerm && searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      items = items.filter(item => {
        const nameMatch = item.name && item.name.toLowerCase().includes(searchLower);
        const descMatch = item.description && item.description.toLowerCase().includes(searchLower);
        const catMatch = item.category && item.category.toLowerCase().includes(searchLower);
        return nameMatch || descMatch || catMatch;
      });
    } else if (selectedCategory) {
      items = items.filter(item => 
        item.category === selectedCategory || (!item.category && selectedCategory === "Others")
      );
    }
    
    return items;
  };

  const filteredItems = getFilteredItems();
  const categories = [...new Set((processedMenuData || []).map(item => item.category || "Others"))];

  // Function to check if item already exists in cart and increment quantity
  const addToCart = (item) => {
    if (!item) return;
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        // If item exists, increment quantity by 1
        return prev.map(i => 
          i.id === item.id 
            ? { ...i, quantity: (i.quantity || 0) + 1 } 
            : i
        );
      }
      // If item doesn't exist, add with quantity 1
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  // Function to add multiple items at once (for repeating an order)
  const addMultipleToCart = (items) => {
    if (!items || items.length === 0) return;
    
    setCart(prev => {
      let updatedCart = [...prev];
      
      items.forEach(newItem => {
        const existing = updatedCart.find(i => i.id === newItem.id);
        if (existing) {
          // Increment quantity
          updatedCart = updatedCart.map(i => 
            i.id === newItem.id 
              ? { ...i, quantity: (i.quantity || 0) + (newItem.quantity || 1) } 
              : i
          );
        } else {
          // Add new item
          updatedCart.push({ ...newItem });
        }
      });
      
      return updatedCart;
    });
  };

  const removeFromCart = (itemId) => {
    if (isOrderLocked && editingOrderId === lockedOrderId) {
      alert("⚠️ This order is locked. You cannot remove items. You can only add new items.");
      return;
    }
    if (!itemId) return;
    setCart(prev => {
      const existing = prev.find(i => i.id === itemId);
      if (existing && existing.quantity > 1) {
        return prev.map(i => i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i);
      }
      return prev.filter(i => i.id !== itemId);
    });
  };

  const deleteFromCart = (itemId) => {
    if (isOrderLocked && editingOrderId === lockedOrderId) {
      alert("⚠️ This order is locked. You cannot delete items. You can only add new items.");
      return;
    }
    if (!itemId) return;
    setCart(prev => prev.filter(i => i.id !== itemId));
  };

  const clearCart = () => {
    if (isOrderLocked && editingOrderId === lockedOrderId) {
      alert("⚠️ This order is locked. You cannot clear items.");
      return;
    }
    if (window.confirm("Clear all items from the current order?")) {
      setCart([]);
      setOrderNote("");
      setEditingOrderId(null);
      setIsNewOrder(true);
      setDeliveryAddress("");
      setCustomerName("");
      setCustomerPhone("");
      setShowAddressInput(false);
      setIsOrderLocked(false);
      setLockedOrderId(null);
      setActiveLockedOrder(null);
      setExistingOrderItems([]);
      setShowExistingItems(false);
    }
  };

  const calculateTotal = () => {
    const subtotal = cart.reduce((total, item) => {
      const price = parseFloat(item.price) || 0;
      return total + (price * (item.quantity || 0));
    }, 0);
    return subtotal + deliveryCharge;
  };

  const splitCartByKOT = () => {
    const kotItems = cart.filter(item => needsKOT(item));
    const nonKotItems = cart.filter(item => !needsKOT(item));
    return { kotItems, nonKotItems };
  };

  const splitCartByCategory = () => {
    const kitchenItems = cart.filter(item => isKitchenCategory(item.category));
    const beverageItems = cart.filter(item => isBeverageCategory(item.category));
    const otherItems = cart.filter(item => !isKitchenCategory(item.category) && !isBeverageCategory(item.category) && needsKOT(item));
    return { kitchenItems, beverageItems, otherItems };
  };

  const calculateKOTTotal = () => {
    const { kotItems } = splitCartByKOT();
    return kotItems.reduce((total, item) => {
      const price = parseFloat(item.price) || 0;
      return total + (price * (item.quantity || 0));
    }, 0);
  };

  const calculateNonKOTTotal = () => {
    const { nonKotItems } = splitCartByKOT();
    return nonKotItems.reduce((total, item) => {
      const price = parseFloat(item.price) || 0;
      return total + (price * (item.quantity || 0));
    }, 0);
  };

  const calculateSubtotal = () => {
    return cart.reduce((total, item) => {
      const price = parseFloat(item.price) || 0;
      return total + (price * (item.quantity || 0));
    }, 0);
  };

  const handleOrderTypeChange = (type) => {
    setOrderType(type);
    if (type === "home-delivery") {
      setShowAddressInput(true);
      setDeliveryCharge(60);
    } else {
      setShowAddressInput(false);
      setDeliveryCharge(0);
      setDeliveryAddress("");
    }
    if (type === "dine-in") {
      setTableNumber("");
    }
  };

  const lockOrder = (orderId, orderData) => {
    setIsOrderLocked(true);
    setLockedOrderId(orderId);
    setActiveLockedOrder(orderData);
  };

  const unlockOrder = () => {
    if (window.confirm("⚠️ Are you sure you want to unlock this order? This will allow modifications to existing items.")) {
      setIsOrderLocked(false);
      setLockedOrderId(null);
      setActiveLockedOrder(null);
    }
  };

  // Print KOT Function
  const printKOT = (kotData, type) => {
    if (!kotData) {
      alert("No KOT data to print.");
      return;
    }
    
    setKotData(kotData);
    setKotType(type);
    setShowKOTModal(true);
  };

  // Generate Kitchen KOT for current cart
  const generateKitchenKOT = () => {
    const { kitchenItems, otherItems } = splitCartByCategory();
    const allKitchenItems = [...kitchenItems, ...otherItems];
    
    if (allKitchenItems.length === 0) {
      alert("No kitchen items in the current order.");
      return;
    }
    
    if (!tableNumber && orderType === "dine-in") {
      alert("Please select a table number before generating KOT.");
      return;
    }
    
    const kotData = {
      kotNumber: `KITCHEN-${Date.now()}`,
      tableNumber: orderType === "dine-in" ? parseInt(tableNumber) || 0 : 0,
      staffName: staffName || "Unknown",
      orderType: orderType,
      items: allKitchenItems.map(item => ({
        name: item.name || "Unknown",
        quantity: item.quantity || 0,
        price: item.price || "0",
        category: item.category || "Other"
      })),
      timestamp: new Date().toLocaleString(),
      total: allKitchenItems.reduce((sum, item) => sum + (parseFloat(item.price) || 0) * (item.quantity || 0), 0),
      note: orderNote || "",
      type: "kitchen"
    };
    
    printKOT(kotData, "kitchen");
  };

  // Generate Beverage KOT for current cart
  const generateBeverageKOT = () => {
    const { beverageItems } = splitCartByCategory();
    
    if (beverageItems.length === 0) {
      alert("No beverage items in the current order.");
      return;
    }
    
    if (!tableNumber && orderType === "dine-in") {
      alert("Please select a table number before generating KOT.");
      return;
    }
    
    const kotData = {
      kotNumber: `BEVERAGE-${Date.now()}`,
      tableNumber: orderType === "dine-in" ? parseInt(tableNumber) || 0 : 0,
      staffName: staffName || "Unknown",
      orderType: orderType,
      items: beverageItems.map(item => ({
        name: item.name || "Unknown",
        quantity: item.quantity || 0,
        price: item.price || "0",
        category: item.category || "Other"
      })),
      timestamp: new Date().toLocaleString(),
      total: beverageItems.reduce((sum, item) => sum + (parseFloat(item.price) || 0) * (item.quantity || 0), 0),
      note: orderNote || "",
      type: "beverage"
    };
    
    printKOT(kotData, "beverage");
  };

  // Print KOT for a specific order
  const printKOTForOrder = (order, type = "kitchen") => {
    if (!order || !order.items) {
      alert("No items in this order.");
      return;
    }
    
    let items = [];
    if (type === "kitchen") {
      const { kitchenItems, otherItems } = splitCartByCategoryForOrder(order);
      items = [...kitchenItems, ...otherItems];
    } else {
      const { beverageItems } = splitCartByCategoryForOrder(order);
      items = beverageItems;
    }
    
    if (items.length === 0) {
      alert(`No ${type} items in this order.`);
      return;
    }
    
    const kotData = {
      kotNumber: type === "kitchen" ? `KITCHEN-${Date.now()}` : `BEVERAGE-${Date.now()}`,
      tableNumber: order.tableNumber || 0,
      staffName: order.staffName || "Unknown",
      orderType: order.orderType || "dine-in",
      items: items.map(item => ({
        name: item.name || "Unknown",
        quantity: item.quantity || 0,
        price: item.price || "0",
        category: item.category || "Other"
      })),
      timestamp: new Date().toLocaleString(),
      total: items.reduce((sum, item) => sum + (parseFloat(item.price) || 0) * (item.quantity || 0), 0),
      note: order.note || "",
      type: type
    };
    
    printKOT(kotData, type);
  };

  const splitCartByCategoryForOrder = (order) => {
    const kitchenItems = order.items.filter(item => isKitchenCategory(item.category));
    const beverageItems = order.items.filter(item => isBeverageCategory(item.category));
    const otherItems = order.items.filter(item => !isKitchenCategory(item.category) && !isBeverageCategory(item.category) && needsKOT(item));
    return { kitchenItems, beverageItems, otherItems };
  };

  // Direct place order - no modal
  const handlePlaceOrder = async () => {
    if (!staffName) {
      alert("Please enter your name.");
      return;
    }
    
    if (orderType === "dine-in" && !tableNumber) {
      alert("Please select a table number.");
      return;
    }
    
    if (orderType === "home-delivery" && !deliveryAddress) {
      alert("Please enter delivery address for home delivery.");
      return;
    }
    
    if (cart.length === 0) {
      alert("Please add items to the order.");
      return;
    }

    // Check if there are KOT items and offer to print KOT
    const { kotItems } = splitCartByKOT();
    if (kotItems.length > 0) {
      if (window.confirm(`There are ${kotItems.length} KOT items in this order. Would you like to print KOTs before placing the order?`)) {
        // Generate both KOTs if applicable
        const { kitchenItems, beverageItems } = splitCartByCategory();
        if (kitchenItems.length > 0) generateKitchenKOT();
        if (beverageItems.length > 0) generateBeverageKOT();
        // Wait a bit for the KOTs to print before placing order
        setTimeout(() => {
          confirmPlaceOrder();
        }, 500);
        return;
      }
    }

    // Directly place the order
    confirmPlaceOrder();
  };

  const confirmPlaceOrder = async () => {
    const { kotItems, nonKotItems } = splitCartByKOT();
    
    const kots = [];
    if (kotItems.length > 0) {
      const kotByCategory = kotItems.reduce((acc, item) => {
        const category = item.category || "Other";
        if (!acc[category]) acc[category] = [];
        acc[category].push(item);
        return acc;
      }, {});
      
      for (const [category, items] of Object.entries(kotByCategory)) {
        kots.push({
          kotNumber: `KOT-${Date.now()}`,
          tableNumber: orderType === "dine-in" ? parseInt(tableNumber) || 0 : 0,
          staffName: staffName || "Unknown",
          type: category,
          items: items.map(item => ({
            name: item.name || "Unknown",
            quantity: item.quantity || 0,
            price: item.price || "0",
            category: item.category || "Other"
          })),
          timestamp: new Date().toLocaleString(),
          total: items.reduce((sum, item) => sum + (parseFloat(item.price) || 0) * (item.quantity || 0), 0)
        });
      }
    }

    // If we're adding to an existing bill (not a new order), preserve the order ID
    const orderId = isNewOrder ? Date.now() : editingOrderId;

    const orderData = {
      id: orderId,
      tableNumber: orderType === "dine-in" ? parseInt(tableNumber) || 0 : null,
      numberOfGuests: orderType === "dine-in" ? parseInt(numberOfGuests) || 1 : 0,
      items: cart.map(item => ({
        id: item.id,
        name: item.name || "Unknown",
        price: item.price || "0",
        quantity: item.quantity || 0,
        category: item.category || "Other",
        isComplimentary: item.isComplimentary || false
      })),
      total: calculateTotal(),
      subtotal: calculateSubtotal(),
      deliveryCharge: deliveryCharge,
      kotItems: kotItems,
      nonKotItems: nonKotItems,
      kotTotal: calculateKOTTotal(),
      nonKotTotal: calculateNonKOTTotal(),
      note: orderNote || "",
      staffName: staffName || "Unknown",
      status: "pending",
      timestamp: new Date().toISOString(),
      kots: kots,
      isNewOrder: isNewOrder,
      orderType: orderType,
      deliveryAddress: deliveryAddress,
      customerName: customerName,
      customerPhone: customerPhone,
      isLocked: isOrderLocked,
      lockedOrderId: lockedOrderId,
      orderCount: (isNewOrder ? 1 : (activeLockedOrder?.orderCount || 1) + 1),
      previousOrders: isNewOrder ? [] : (activeLockedOrder?.previousOrders || []).concat([{
        id: editingOrderId,
        items: [...cart],
        timestamp: new Date().toISOString(),
        total: calculateTotal()
      }])
    };

    try {
      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      if (response.ok) {
        const orderCount = isNewOrder ? 1 : (activeLockedOrder?.orderCount || 1) + 1;
        alert(`✅ Order #${orderCount} placed successfully for ${orderType === 'dine-in' ? 'Table ' + tableNumber : orderType}!`);
        
        // Remove draft from localStorage
        if (editingOrderId) {
          const updatedOrders = savedOrders.filter(order => order.id !== editingOrderId);
          await saveOrdersToServer(updatedOrders);
        }
        
        setCart([]);
        setOrderNote("");
        setTableNumber("");
        setNumberOfGuests("");
        setSearchTerm("");
        setEditingOrderId(null);
        setIsNewOrder(true);
        setDeliveryAddress("");
        setCustomerName("");
        setCustomerPhone("");
        setShowAddressInput(false);
        setDeliveryCharge(0);
        setIsOrderLocked(false);
        setLockedOrderId(null);
        setActiveLockedOrder(null);
        setExistingOrderItems([]);
        setShowExistingItems(false);
        // Refresh orders from server
        await loadSavedOrdersFromServer();
      } else {
        alert("❌ Failed to place order. Please try again.");
      }
    } catch (error) {
      console.error('Error submitting order:', error);
      alert("❌ Failed to place order. Please try again.");
    }
  };

  const saveOrderAsDraft = async () => {
    if (cart.length === 0) {
      alert("No items to save. Please add items to the order.");
      return;
    }
    
    if (orderType === "dine-in" && !tableNumber) {
      alert("Please select a table number before saving.");
      return;
    }

    if (orderType === "home-delivery" && !deliveryAddress) {
      alert("Please enter delivery address for home delivery.");
      return;
    }

    const { kotItems, nonKotItems } = splitCartByKOT();
    const orderData = {
      id: editingOrderId || Date.now(),
      tableNumber: orderType === "dine-in" ? parseInt(tableNumber) || 0 : null,
      numberOfGuests: orderType === "dine-in" ? parseInt(numberOfGuests) || 1 : 0,
      items: [...cart],
      total: calculateTotal(),
      subtotal: calculateSubtotal(),
      deliveryCharge: deliveryCharge,
      kotItems: kotItems,
      nonKotItems: nonKotItems,
      kotTotal: calculateKOTTotal(),
      nonKotTotal: calculateNonKOTTotal(),
      note: orderNote || "",
      staffName: staffName || "Unknown",
      status: "draft",
      timestamp: new Date().toISOString(),
      lastUpdated: new Date().toLocaleString(),
      isNewOrder: isNewOrder,
      orderType: orderType,
      deliveryAddress: deliveryAddress,
      customerName: customerName,
      customerPhone: customerPhone,
      isLocked: true,
      lockedOrderId: editingOrderId || Date.now(),
      orderCount: isNewOrder ? 1 : (activeLockedOrder?.orderCount || 1) + 1,
      previousOrders: isNewOrder ? [] : (activeLockedOrder?.previousOrders || []).concat([{
        id: editingOrderId,
        items: [...cart],
        timestamp: new Date().toISOString(),
        total: calculateTotal()
      }])
    };

    let updatedOrders;
    if (editingOrderId) {
      updatedOrders = savedOrders.map(order => order.id === editingOrderId ? orderData : order);
    } else {
      updatedOrders = [...savedOrders, orderData];
    }

    await saveOrdersToServer(updatedOrders);
    
    lockOrder(orderData.id, orderData);
    
    const orderCount = isNewOrder ? 1 : (activeLockedOrder?.orderCount || 1) + 1;
    alert(`✅ Order #${orderCount} saved as draft for ${orderType === 'dine-in' ? 'Table ' + tableNumber : orderType}! Order is now locked. You can add more items to this order.`);
    
    setEditingOrderId(orderData.id);
    setIsNewOrder(false);
    setShowSavedOrders(true);
  };

  // Function to repeat an existing order
  const repeatOrder = (order) => {
    if (!order || !order.items) return;
    
    // Check if there are items in the cart
    if (cart.length > 0) {
      if (!window.confirm("This will add items to your current cart. Continue?")) {
        return;
      }
    }
    
    // Get items from the order and add them to cart with quantity
    const itemsToAdd = order.items.map(item => ({
      ...item,
      quantity: item.quantity || 1
    }));
    
    addMultipleToCart(itemsToAdd);
    alert(`✅ Added ${itemsToAdd.length} items from the previous order to your cart!`);
  };

  const loadSavedOrder = (order) => {
    if (!order) return;
    setTableNumber(order.tableNumber ? String(order.tableNumber) : "");
    setNumberOfGuests(order.numberOfGuests ? String(order.numberOfGuests) : "");
    setCart(order.items || []);
    setOrderNote(order.note || "");
    setEditingOrderId(order.id || null);
    setIsNewOrder(order.isNewOrder !== undefined ? order.isNewOrder : true);
    setOrderType(order.orderType || "dine-in");
    setDeliveryAddress(order.deliveryAddress || "");
    setCustomerName(order.customerName || "");
    setCustomerPhone(order.customerPhone || "");
    setDeliveryCharge(order.deliveryCharge || 0);
    
    // Store existing order items for repeat functionality
    setExistingOrderItems(order.items || []);
    setShowExistingItems(true);
    
    if (order.isLocked) {
      setIsOrderLocked(true);
      setLockedOrderId(order.id);
      setActiveLockedOrder(order);
    } else {
      setIsOrderLocked(false);
      setLockedOrderId(null);
      setActiveLockedOrder(null);
    }
    
    if (order.orderType === "home-delivery") {
      setShowAddressInput(true);
    } else {
      setShowAddressInput(false);
    }
    setShowSavedOrders(false);
    setShowTableDropdown(false);
  };

  const openTransferModal = (order) => {
    if (!order) {
      alert("Please load an order first to transfer.");
      return;
    }
    setTransferOrder(order);
    setTransferFromTable(order.tableNumber ? String(order.tableNumber) : "");
    setTransferToTable("");
    setShowTransferModal(true);
  };

  const confirmTransferTable = async () => {
    if (!transferOrder) return;
    
    const fromTable = parseInt(transferFromTable);
    const toTable = parseInt(transferToTable);
    
    if (!toTable || toTable < 1 || toTable > TABLE_COUNT) {
      alert(`Please select a valid table number (1-${TABLE_COUNT}).`);
      return;
    }
    
    if (fromTable === toTable) {
      alert("Source and destination tables are the same. No transfer needed.");
      setShowTransferModal(false);
      return;
    }
    
    const existingOrderAtDestination = savedOrders.find(order => 
      order.tableNumber === toTable && 
      order.status === "draft" && 
      order.orderType === "dine-in"
    );
    
    if (existingOrderAtDestination && existingOrderAtDestination.id !== transferOrder.id) {
      if (!window.confirm(`Table ${toTable} already has an active order. Do you want to merge the orders?`)) {
        return;
      }
      const mergedOrder = {
        ...existingOrderAtDestination,
        items: [...existingOrderAtDestination.items, ...transferOrder.items],
        total: existingOrderAtDestination.total + transferOrder.total,
        subtotal: existingOrderAtDestination.subtotal + transferOrder.subtotal,
        kotItems: [...existingOrderAtDestination.kotItems || [], ...transferOrder.kotItems || []],
        nonKotItems: [...existingOrderAtDestination.nonKotItems || [], ...transferOrder.nonKotItems || []],
        kotTotal: (existingOrderAtDestination.kotTotal || 0) + (transferOrder.kotTotal || 0),
        nonKotTotal: (existingOrderAtDestination.nonKotTotal || 0) + (transferOrder.nonKotTotal || 0),
        note: existingOrderAtDestination.note + (transferOrder.note ? ` | Transferred from Table ${fromTable}: ${transferOrder.note}` : ` | Transferred from Table ${fromTable}`),
        lastUpdated: new Date().toLocaleString(),
        orderCount: (existingOrderAtDestination.orderCount || 1) + (transferOrder.orderCount || 1)
      };
      
      let updatedOrders = savedOrders.filter(order => 
        order.id !== transferOrder.id && order.id !== existingOrderAtDestination.id
      );
      updatedOrders.push(mergedOrder);
      await saveOrdersToServer(updatedOrders);
      
      alert(`✅ Order merged from Table ${fromTable} to Table ${toTable}! Items have been combined.`);
      
      loadSavedOrder(mergedOrder);
      setShowTransferModal(false);
      setTransferOrder(null);
      return;
    }
    
    const updatedOrder = {
      ...transferOrder,
      tableNumber: toTable,
      note: transferOrder.note + ` | Transferred from Table ${fromTable} to Table ${toTable}`,
      lastUpdated: new Date().toLocaleString()
    };
    
    let updatedOrders = savedOrders.filter(order => order.id !== transferOrder.id);
    updatedOrders.push(updatedOrder);
    await saveOrdersToServer(updatedOrders);
    
    alert(`✅ Order successfully transferred from Table ${fromTable} to Table ${toTable}!`);
    
    loadSavedOrder(updatedOrder);
    setShowTransferModal(false);
    setTransferOrder(null);
  };

  const startNewOrder = () => {
    if (cart.length > 0 && !window.confirm("You have items in the current order. Start a new order anyway?")) {
      return;
    }
    setCart([]);
    setOrderNote("");
    setTableNumber("");
    setNumberOfGuests("");
    setEditingOrderId(null);
    setIsNewOrder(true);
    setIsOrderLocked(false);
    setLockedOrderId(null);
    setActiveLockedOrder(null);
    setDeliveryAddress("");
    setCustomerName("");
    setCustomerPhone("");
    setShowAddressInput(false);
    setDeliveryCharge(0);
    setSearchTerm("");
    setExistingOrderItems([]);
    setShowExistingItems(false);
  };

  const continueOrder = async () => {
    if (orderType === "dine-in") {
      if (!tableNumber) {
        alert("Please select a table number to continue.");
        return;
      }
      
      await loadSavedOrdersFromServer();
      
      const existingOrder = savedOrders.find(order => 
        order.tableNumber === parseInt(tableNumber) && 
        order.status === "draft" &&
        order.orderType === "dine-in"
      );
      
      if (existingOrder) {
        loadSavedOrder(existingOrder);
        // Show existing items for repeat
        setExistingOrderItems(existingOrder.items || []);
        setShowExistingItems(true);
      } else {
        setIsNewOrder(true);
        setEditingOrderId(null);
        setCart([]);
        setOrderNote("");
        setIsOrderLocked(false);
        setLockedOrderId(null);
        setActiveLockedOrder(null);
        setExistingOrderItems([]);
        setShowExistingItems(false);
        alert(`No existing draft order found for Table ${tableNumber}. Starting a new order.`);
      }
    } else {
      if (!customerName && !customerPhone) {
        alert("Please enter customer name or phone to continue.");
        return;
      }
      
      await loadSavedOrdersFromServer();
      
      const existingOrder = savedOrders.find(order => 
        order.orderType === orderType &&
        order.status === "draft" &&
        (order.customerName === customerName || order.customerPhone === customerPhone)
      );
      
      if (existingOrder) {
        loadSavedOrder(existingOrder);
        setExistingOrderItems(existingOrder.items || []);
        setShowExistingItems(true);
      } else {
        setIsNewOrder(true);
        setEditingOrderId(null);
        setCart([]);
        setOrderNote("");
        setIsOrderLocked(false);
        setLockedOrderId(null);
        setActiveLockedOrder(null);
        setExistingOrderItems([]);
        setShowExistingItems(false);
        alert(`No existing draft order found for this ${orderType}. Starting a new order.`);
      }
    }
  };

  const handleStaffNameChange = (e) => {
    const name = e.target.value;
    setStaffName(name);
    localStorage.setItem("staffName", name);
  };

  const handleTableNumberChange = (e) => {
    const value = e.target.value;
    setTableNumber(value);
    
    if (value && value.trim()) {
      const searchLower = value.toLowerCase().trim();
      const filtered = savedOrders
        .filter(order => order.status === "draft" && order.orderType === "dine-in")
        .filter(order => 
          String(order.tableNumber).includes(searchLower) ||
          (order.staffName && order.staffName.toLowerCase().includes(searchLower))
        );
      setFilteredTables(filtered);
      setShowTableDropdown(true);
    } else {
      const drafts = savedOrders.filter(order => order.status === "draft" && order.orderType === "dine-in");
      setFilteredTables(drafts);
      setShowTableDropdown(true);
    }
  };

  const handleTableNumberFocus = () => {
    const drafts = savedOrders.filter(order => order.status === "draft" && order.orderType === "dine-in");
    setFilteredTables(drafts);
    setShowTableDropdown(true);
  };

  const handleTableNumberBlur = () => {
    setTimeout(() => setShowTableDropdown(false), 200);
  };

  const selectTable = (order) => {
    loadSavedOrder(order);
  };

  const printOrder = () => {
    if (cart.length === 0) {
      alert("No items in the order to print.");
      return;
    }
    window.print();
  };

  const clearSearch = () => setSearchTerm("");

  const getSavedOrdersCount = () => {
    return savedOrders.filter(order => order.status === "draft").length;
  };

  const getOngoingOrders = () => {
    return savedOrders.filter(order => order.status === "draft" && order.items && order.items.length > 0);
  };

  const tableNumbers = Array.from({ length: TABLE_COUNT }, (_, i) => i + 1);

  const syncOrders = async () => {
    await loadSavedOrdersFromServer();
    alert("✅ Orders synced with server!");
  };

  // Close KOT modal and print
  const closeKOTModal = () => {
    setShowKOTModal(false);
    setKotData(null);
    setKotType("kitchen");
  };

  const printKOTContent = () => {
    window.print();
  };

  // Check if there are any KOT items in cart
  const hasKOTItems = () => {
    return cart.some(item => needsKOT(item));
  };

  // Check if there are any kitchen items in cart
  const hasKitchenItems = () => {
    const { kitchenItems, otherItems } = splitCartByCategory();
    return kitchenItems.length > 0 || otherItems.length > 0;
  };

  // Check if there are any beverage items in cart
  const hasBeverageItems = () => {
    const { beverageItems } = splitCartByCategory();
    return beverageItems.length > 0;
  };

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
    <div className="min-h-screen bg-[#1C242A] p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col items-center gap-1 md:gap-2 mb-4 md:mb-6">
          <div className="flex items-center justify-center w-full">
            <img src={logo} alt="Café Élan" className="h-10 md:h-12 lg:h-14 object-contain" />
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center gap-2 md:gap-3 w-full">
            <div className="flex items-center gap-2">
              <h1 className="text-base md:text-lg lg:text-2xl font-bold text-amber-500 whitespace-nowrap">
                Service Staff - Take Order
              </h1>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-1.5 md:gap-2 w-full md:w-auto">
              <button
                onClick={() => setShowSavedOrders(!showSavedOrders)}
                className={`px-2.5 py-1.5 md:px-4 md:py-2 rounded-lg transition flex items-center gap-1 md:gap-1.5 text-[10px] md:text-sm font-semibold flex-1 md:flex-none justify-center ${
                  showSavedOrders 
                    ? 'bg-amber-500 text-black' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                <FaHistory className="text-[10px] md:text-sm" /> 
                <span className="hidden xs:inline">Saved Orders</span>
                <span className="xs:hidden">Saved</span>
                {getSavedOrdersCount() > 0 && (
                  <span className="bg-red-500 text-white text-[8px] md:text-[10px] rounded-full px-1.5 py-0.5 ml-0.5 min-w-[16px] md:min-w-[18px] text-center">
                    {getSavedOrdersCount()}
                  </span>
                )}
              </button>
              
              <button
                onClick={() => window.location.href = '/orders'}
                className="bg-green-600 text-white px-2.5 py-1.5 md:px-4 md:py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-1 md:gap-1.5 text-[10px] md:text-sm font-semibold flex-1 md:flex-none justify-center"
              >
                <FaReceipt className="text-[10px] md:text-sm" /> 
                <span className="hidden xs:inline">View Orders</span>
                <span className="xs:hidden">Orders</span>
              </button>

              <button
                onClick={syncOrders}
                disabled={syncing}
                className="bg-purple-600 text-white px-2.5 py-1.5 md:px-4 md:py-2 rounded-lg hover:bg-purple-700 transition flex items-center gap-1 md:gap-1.5 text-[10px] md:text-sm font-semibold flex-1 md:flex-none justify-center"
              >
                <FaSync className={`text-[10px] md:text-sm ${syncing ? 'animate-spin' : ''}`} /> 
                <span className="hidden xs:inline">{syncing ? 'Syncing...' : 'Sync'}</span>
                <span className="xs:hidden">↻</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sync Status */}
        {syncing && (
          <div className="mb-4 bg-blue-500/20 border border-blue-500/30 rounded-xl p-2 text-center">
            <p className="text-blue-400 text-xs flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-400 border-t-transparent"></div>
              Syncing orders with server...
            </p>
          </div>
        )}

        {/* Lock Status Banner */}
        {isOrderLocked && activeLockedOrder && (
          <div className="mb-4 bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <FaLock className="text-yellow-500 text-xl" />
                <div>
                  <p className="text-yellow-500 font-semibold">
                    🔒 Order Locked - {activeLockedOrder.orderType === 'dine-in' ? `Table ${activeLockedOrder.tableNumber}` : activeLockedOrder.orderType}
                    {activeLockedOrder.orderCount > 1 && (
                      <span className="ml-2 text-xs">(Order #{activeLockedOrder.orderCount})</span>
                    )}
                  </p>
                  <p className="text-gray-400 text-xs">
                    You can only add items to this order. Use "Start New Order" to take orders for other tables.
                  </p>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={unlockOrder}
                  className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-red-500 transition flex items-center gap-1"
                >
                  <FaUnlock /> Unlock
                </button>
                <button
                  onClick={startNewOrder}
                  className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-500 transition flex items-center gap-1"
                >
                  <FaClipboardList /> Start New Order
                </button>
                <button
                  onClick={() => openTransferModal(activeLockedOrder)}
                  className="bg-purple-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-purple-500 transition flex items-center gap-1"
                >
                  <FaExchangeAlt /> Transfer
                </button>
                {/* Repeat Order Button */}
                {existingOrderItems.length > 0 && (
                  <button
                    onClick={() => repeatOrder({ items: existingOrderItems })}
                    className="bg-amber-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-amber-500 transition flex items-center gap-1"
                  >
                    <FaCopy /> Repeat Order
                  </button>
                )}
                {/* Print KOT Buttons */}
                {hasKitchenItems() && (
                  <button
                    onClick={generateKitchenKOT}
                    className="bg-orange-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-orange-500 transition flex items-center gap-1"
                  >
                    <FaUtensils /> Kitchen KOT
                  </button>
                )}
                {hasBeverageItems() && (
                  <button
                    onClick={generateBeverageKOT}
                    className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-500 transition flex items-center gap-1"
                  >
                    <FaCoffee /> Beverage KOT
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Show existing items summary */}
        {showExistingItems && existingOrderItems.length > 0 && !isOrderLocked && (
          <div className="mb-4 bg-blue-500/10 border border-blue-500/30 rounded-xl p-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <FaFileInvoice className="text-blue-400" />
                <span className="text-blue-400 text-sm">
                  Previous order has {existingOrderItems.length} items
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => repeatOrder({ items: existingOrderItems })}
                  className="bg-amber-600 text-white px-3 py-1 rounded-lg text-xs font-semibold hover:bg-amber-500 transition flex items-center gap-1"
                >
                  <FaCopy /> Repeat Previous Order
                </button>
                {existingOrderItems.filter(item => isKitchenCategory(item.category) || needsKOT(item)).length > 0 && (
                  <button
                    onClick={() => printKOTForOrder({ items: existingOrderItems, tableNumber: parseInt(tableNumber), staffName: staffName, orderType: orderType, note: orderNote }, "kitchen")}
                    className="bg-orange-600 text-white px-3 py-1 rounded-lg text-xs font-semibold hover:bg-orange-500 transition flex items-center gap-1"
                  >
                    <FaUtensils /> Kitchen KOT
                  </button>
                )}
                {existingOrderItems.filter(item => isBeverageCategory(item.category)).length > 0 && (
                  <button
                    onClick={() => printKOTForOrder({ items: existingOrderItems, tableNumber: parseInt(tableNumber), staffName: staffName, orderType: orderType, note: orderNote }, "beverage")}
                    className="bg-blue-600 text-white px-3 py-1 rounded-lg text-xs font-semibold hover:bg-blue-500 transition flex items-center gap-1"
                  >
                    <FaCoffee /> Beverage KOT
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Ongoing Orders Quick Access */}
        {getOngoingOrders().length > 0 && !showSavedOrders && (
          <div className="mb-4 bg-[#2A2A2A] rounded-xl p-3 border border-white/10">
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
              <FaClock /> Ongoing Orders (Drafts)
            </div>
            <div className="flex flex-wrap gap-2">
              {getOngoingOrders().slice(0, 5).map(order => (
                <button
                  key={order.id}
                  onClick={() => loadSavedOrder(order)}
                  className="bg-[#1C242A] hover:bg-amber-500/20 px-3 py-1.5 rounded-lg text-sm text-white border border-white/5 transition flex items-center gap-2"
                >
                  <span className="font-semibold text-amber-500">
                    {order.orderType === "dine-in" ? `Table ${order.tableNumber}` : order.orderType}
                  </span>
                  <span className="text-gray-400">({order.items ? order.items.length : 0} items)</span>
                  {order.isLocked && (
                    <FaLock className="text-yellow-500 text-[10px]" />
                  )}
                  {order.orderCount > 1 && (
                    <span className="text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded-full">
                      #{order.orderCount}
                    </span>
                  )}
                </button>
              ))}
              {getOngoingOrders().length > 5 && (
                <button
                  onClick={() => setShowSavedOrders(true)}
                  className="bg-[#1C242A] hover:bg-amber-500/20 px-3 py-1.5 rounded-lg text-sm text-amber-400 border border-white/5 transition"
                >
                  +{getOngoingOrders().length - 5} more
                </button>
              )}
            </div>
          </div>
        )}

        {/* Saved Orders Panel */}
        {showSavedOrders && (
          <div className="mb-6 bg-[#2A2A2A] rounded-xl p-4 border border-white/10">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold text-amber-500">Saved Orders (Drafts)</h2>
              <button onClick={() => setShowSavedOrders(false)} className="text-gray-400 hover:text-white">
                ✕
              </button>
            </div>
            {savedOrders.filter(order => order.status === "draft").length === 0 ? (
              <div className="text-center text-gray-400 py-4">No saved orders found</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {savedOrders.filter(order => order.status === "draft").map(order => (
                  <div key={order.id} className="bg-[#1C242A] rounded-lg p-3 border border-white/5">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-white font-semibold flex items-center gap-2">
                          {order.orderType === "dine-in" ? `Table ${order.tableNumber}` : order.orderType}
                          {order.isLocked && (
                            <FaLock className="text-yellow-500 text-[10px]" />
                          )}
                          {order.orderCount > 1 && (
                            <span className="text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded-full">
                              #{order.orderCount}
                            </span>
                          )}
                        </p>
                        <p className="text-gray-400 text-xs">
                          {order.orderType === "dine-in" ? `${order.numberOfGuests} guests • ` : ''}
                          {order.items ? order.items.length : 0} items
                        </p>
                        <p className="text-amber-500 font-bold text-sm">₹{(order.total || 0).toFixed(2)}</p>
                        {order.note && <p className="text-gray-400 text-xs mt-1">📝 {order.note}</p>}
                        {order.orderType === "home-delivery" && (
                          <p className="text-blue-400 text-xs">📍 {order.deliveryAddress}</p>
                        )}
                        {order.isLocked && (
                          <p className="text-yellow-500 text-[10px] mt-1">🔒 Locked - Add only</p>
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => loadSavedOrder(order)}
                          className="bg-amber-500 text-black px-2 py-1 rounded text-xs font-semibold hover:bg-amber-400"
                        >
                          Load
                        </button>
                        {order.orderType === "dine-in" && (
                          <button
                            onClick={() => openTransferModal(order)}
                            className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-semibold hover:bg-blue-500"
                          >
                            <FaExchangeAlt className="inline mr-1" size={10} /> Transfer
                          </button>
                        )}
                        <button
                          onClick={() => repeatOrder(order)}
                          className="bg-amber-600 text-white px-2 py-1 rounded text-xs font-semibold hover:bg-amber-500"
                        >
                          <FaCopy className="inline mr-1" size={10} /> Repeat
                        </button>
                        {order.items && order.items.filter(item => isKitchenCategory(item.category) || needsKOT(item)).length > 0 && (
                          <button
                            onClick={() => printKOTForOrder(order, "kitchen")}
                            className="bg-orange-600 text-white px-2 py-1 rounded text-xs font-semibold hover:bg-orange-500"
                          >
                            <FaUtensils className="inline mr-1" size={10} /> Kitchen KOT
                          </button>
                        )}
                        {order.items && order.items.filter(item => isBeverageCategory(item.category)).length > 0 && (
                          <button
                            onClick={() => printKOTForOrder(order, "beverage")}
                            className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-semibold hover:bg-blue-500"
                          >
                            <FaCoffee className="inline mr-1" size={10} /> Beverage KOT
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 text-[10px] text-gray-500 border-t border-white/5 pt-1">
                      <span>⚠️ Delete orders from Orders View page</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-4">
            {/* Staff Info */}
            <div className="bg-[#2A2A2A] rounded-xl p-4 border border-white/10">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                <div className="md:col-span-1">
                  <label className="block text-sm font-semibold text-amber-500 mb-1">Order Type *</label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleOrderTypeChange("dine-in")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                        orderType === "dine-in"
                          ? 'bg-amber-500 text-black'
                          : 'bg-[#1C242A] text-white hover:bg-amber-500/20'
                      }`}
                    >
                      <FaHotel /> Dine-in
                    </button>
                    <button
                      onClick={() => handleOrderTypeChange("takeaway")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                        orderType === "takeaway"
                          ? 'bg-amber-500 text-black'
                          : 'bg-[#1C242A] text-white hover:bg-amber-500/20'
                      }`}
                    >
                      <FaShoppingBag /> Takeaway
                    </button>
                    <button
                      onClick={() => handleOrderTypeChange("home-delivery")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                        orderType === "home-delivery"
                          ? 'bg-amber-500 text-black'
                          : 'bg-[#1C242A] text-white hover:bg-amber-500/20'
                      }`}
                    >
                      <FaTruck /> Home Delivery
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-amber-500 mb-1 flex items-center gap-2">
                    <FaUser /> Staff Name *
                  </label>
                  <input
                    type="text"
                    value={staffName}
                    onChange={handleStaffNameChange}
                    className="w-full bg-[#1C242A] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    placeholder="Enter your name"
                  />
                </div>
                
                {orderType === "dine-in" ? (
                  <div className="relative">
                    <label className="block text-sm font-semibold text-amber-500 mb-1">Table Number *</label>
                    <div className="relative">
                      <select
                        value={tableNumber}
                        onChange={(e) => {
                          setTableNumber(e.target.value);
                          const drafts = savedOrders
                            .filter(order => order.status === "draft" && order.orderType === "dine-in");
                          setFilteredTables(drafts);
                          setShowTableDropdown(true);
                        }}
                        onFocus={handleTableNumberFocus}
                        onBlur={handleTableNumberBlur}
                        className="w-full bg-[#1C242A] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 appearance-none"
                      >
                        <option value="">Select Table</option>
                        {tableNumbers.map(num => (
                          <option key={num} value={num}>Table {num}</option>
                        ))}
                      </select>
                      <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                    {showTableDropdown && filteredTables.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-[#2A2A2A] border border-white/10 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filteredTables.map(order => (
                          <button
                            key={order.id}
                            onClick={() => selectTable(order)}
                            className="w-full text-left px-4 py-2 hover:bg-amber-500/20 transition flex justify-between items-center border-b border-white/5 last:border-0"
                          >
                            <div>
                              <span className="text-white font-semibold">Table {order.tableNumber}</span>
                              <span className="text-gray-400 text-xs ml-2">
                                {order.items ? order.items.length : 0} items • ₹{(order.total || 0).toFixed(2)}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500">{order.staffName}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-amber-500 mb-1 flex items-center gap-2">
                        <FaUser /> Customer Name *
                      </label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full bg-[#1C242A] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                        placeholder="Enter customer name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-amber-500 mb-1 flex items-center gap-2">
                        <FaUser /> Phone Number
                      </label>
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full bg-[#1C242A] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                        placeholder="Enter phone number"
                      />
                    </div>
                  </>
                )}
              </div>

              {orderType === "dine-in" && (
                <div className="mt-3">
                  <label className="block text-sm font-semibold text-amber-500 mb-1 flex items-center gap-2">
                    <FaUsers /> Number of Guests
                  </label>
                  <input
                    type="number"
                    value={numberOfGuests}
                    onChange={(e) => setNumberOfGuests(e.target.value)}
                    className="w-full md:w-1/3 bg-[#1C242A] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    placeholder="Enter number of guests"
                    min="1"
                  />
                </div>
              )}

              {showAddressInput && (
                <div className="mt-3">
                  <label className="block text-sm font-semibold text-amber-500 mb-1 flex items-center gap-2">
                    <FaTruck /> Delivery Address *
                  </label>
                  <textarea
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full bg-[#1C242A] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    placeholder="Enter delivery address"
                    rows="2"
                  />
                  <p className="text-xs text-gray-400 mt-1">💰 Delivery charge: ₹60 (flat rate)</p>
                </div>
              )}

              <div className="mt-3 flex gap-2 flex-wrap">
                <button
                  onClick={continueOrder}
                  className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-blue-700 transition flex items-center gap-2"
                >
                  <FaClock /> Continue Order
                </button>
                <button
                  onClick={startNewOrder}
                  className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-green-500 transition flex items-center gap-2"
                >
                  <FaClipboardList /> Start New Order
                </button>
                {orderType === "dine-in" && editingOrderId && (
                  <button
                    onClick={() => {
                      const order = savedOrders.find(o => o.id === editingOrderId);
                      if (order) openTransferModal(order);
                    }}
                    className="bg-purple-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-purple-500 transition flex items-center gap-2"
                  >
                    <FaExchangeAlt /> Transfer Table
                  </button>
                )}
                {/* Print KOT Buttons */}
                {hasKitchenItems() && (
                  <button
                    onClick={generateKitchenKOT}
                    className="bg-orange-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-orange-500 transition flex items-center gap-2"
                  >
                    <FaUtensils /> Kitchen KOT
                  </button>
                )}
                {hasBeverageItems() && (
                  <button
                    onClick={generateBeverageKOT}
                    className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-blue-500 transition flex items-center gap-2"
                  >
                    <FaCoffee /> Beverage KOT
                  </button>
                )}
                {editingOrderId && (
                  <span className="text-xs text-amber-500 flex items-center ml-2">
                    Editing saved order #{editingOrderId}
                  </span>
                )}
                {!isNewOrder && (
                  <span className="text-xs text-blue-400 flex items-center ml-2">
                    <FaFileInvoice className="mr-1" /> Adding to existing bill
                  </span>
                )}
                {isOrderLocked && (
                  <span className="text-xs text-yellow-500 flex items-center ml-2">
                    <FaLock className="mr-1" /> Locked - Add only
                  </span>
                )}
              </div>
            </div>

            {/* Search & Categories */}
            <div className="bg-[#2A2A2A] rounded-xl p-4 border border-white/10">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search across all categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#1C242A] border border-white/10 rounded-lg pl-10 pr-10 py-2 text-white focus:outline-none focus:border-amber-500"
                />
                {searchTerm && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    ✕
                  </button>
                )}
              </div>
              {!searchTerm && categories.length > 0 && (
                <div className="relative mt-3">
                  {showLeftArrow && (
                    <button
                      onClick={() => scrollCategories('left')}
                      className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-[#1C242A] border border-white/10 text-amber-500 p-1.5 rounded-full shadow-lg hover:bg-amber-500/20 transition-all duration-200"
                    >
                      <FaChevronLeft size={14} />
                    </button>
                  )}

                  <div
                    ref={categoriesScrollRef}
                    className="flex gap-2 overflow-x-auto no-scrollbar scroll-smooth px-6"
                  >
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition flex-shrink-0 ${
                          selectedCategory === cat
                            ? 'bg-amber-500 text-black font-semibold'
                            : 'bg-[#1C242A] text-white hover:bg-amber-500/20'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {showRightArrow && (
                    <button
                      onClick={() => scrollCategories('right')}
                      className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-[#1C242A] border border-white/10 text-amber-500 p-1.5 rounded-full shadow-lg hover:bg-amber-500/20 transition-all duration-200"
                    >
                      <FaChevronRight size={14} />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Menu Items Grid */}
            <div className="bg-[#2A2A2A] rounded-xl p-4 border border-white/10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredItems.length > 0 ? (
                  filteredItems.map(item => {
                    const requiresKOT = needsKOT(item);
                    const isKitchen = isKitchenCategory(item.category);
                    const isBeverage = isBeverageCategory(item.category);
                    const isVariant = item.isVariant || false;
                    
                    // Skip Saleables, Addons, Cigarettes
                    const excludedCategories = ['Saleables', 'Addons', 'Cigarettes', 'Others'];
                    if (excludedCategories.includes(item.category)) return null;
                    
                    return (
                      <div
                        key={item.id}
                        className={`bg-[#1C242A] rounded-lg p-3 border border-white/5 hover:border-amber-500/30 transition cursor-pointer ${
                          isKitchen ? 'border-l-4 border-l-orange-500' : 
                          isBeverage ? 'border-l-4 border-l-blue-500' : 
                          'border-l-4 border-l-gray-500'
                        } ${isVariant ? 'border-r-4 border-r-amber-500/50' : ''}`}
                        onClick={() => addToCart(item)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-white font-medium text-sm">
                                {item.name}
                                {isVariant && (
                                  <span className="text-xs text-amber-400 ml-1">(Variant)</span>
                                )}
                              </span>
                              {item.is_special === 1 && (
                                <span className="text-[10px] bg-yellow-600 text-white px-1.5 py-0.5 rounded">⭐</span>
                              )}
                              {item.is_bestseller === 1 && (
                                <span className="text-[10px] bg-red-600 text-white px-1.5 py-0.5 rounded">🔥</span>
                              )}
                              {isKitchen && (
                                <span className="text-[10px] bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded flex items-center gap-1">
                                  <FaUtensils size={8} /> Kitchen
                                </span>
                              )}
                              {isBeverage && (
                                <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded flex items-center gap-1">
                                  <FaCoffee size={8} /> Beverage
                                </span>
                              )}
                            </div>
                            {item.description && !item.description.includes('/') && (
                              <p className="text-gray-400 text-xs mt-0.5">{item.description}</p>
                            )}
                            <div className="text-gray-500 text-[10px] mt-1">{item.category || 'Other'}</div>
                          </div>
                          <span className="text-amber-500 font-bold text-sm ml-2">₹{item.price || '0'}</span>
                        </div>
                      </div>
                    );
                  }).filter(Boolean)
                ) : (
                  <div className="col-span-2 text-center text-gray-400 py-8">
                    <p className="text-4xl mb-2">📋</p>
                    <p>No items found</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Cart */}
          <div className="lg:col-span-1">
            <div className="bg-[#2A2A2A] rounded-xl p-4 border border-white/10 sticky top-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-amber-500">Current Order</h2>
                <div className="flex items-center gap-2">
                  {hasKitchenItems() && (
                    <button
                      onClick={generateKitchenKOT}
                      className="bg-orange-600 text-white px-2 py-1 rounded text-xs hover:bg-orange-500 transition flex items-center gap-1"
                    >
                      <FaUtensils size={12} /> Kitchen KOT
                    </button>
                  )}
                  {hasBeverageItems() && (
                    <button
                      onClick={generateBeverageKOT}
                      className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-500 transition flex items-center gap-1"
                    >
                      <FaCoffee size={12} /> Beverage KOT
                    </button>
                  )}
                  {cart.length > 0 && !(isOrderLocked && editingOrderId === lockedOrderId) && (
                    <button onClick={clearCart} className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1">
                      <FaTrash /> Clear
                    </button>
                  )}
                  {cart.length > 0 && isOrderLocked && editingOrderId === lockedOrderId && (
                    <span className="text-yellow-500 text-xs flex items-center gap-1">
                      <FaLock /> Locked
                    </span>
                  )}
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto mb-4">
                {cart.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    <p className="text-4xl mb-2">🛒</p>
                    <p>No items in order</p>
                    <p className="text-xs mt-1">Tap menu items to add</p>
                  </div>
                ) : (
                  <>
                    {/* Kitchen Items */}
                    {splitCartByCategory().kitchenItems.length > 0 && (
                      <div className="mb-2">
                        <div className="text-xs text-orange-400 font-semibold flex items-center gap-1 mb-1">
                          <FaUtensils /> Kitchen Items
                          <span className="text-[10px] bg-orange-500/20 px-1.5 py-0.5 rounded ml-1">
                            {splitCartByCategory().kitchenItems.length} items
                          </span>
                        </div>
                        {splitCartByCategory().kitchenItems.map(item => {
                          const isLockedOrder = isOrderLocked && editingOrderId === lockedOrderId;
                          return (
                            <div key={item.id} className="flex items-center justify-between py-2 border-b border-white/5">
                              <div className="flex-1">
                                <p className="text-white text-sm font-medium">{item.name}</p>
                                <p className="text-amber-500 text-xs">₹{item.price} × {item.quantity}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => removeFromCart(item.id)} 
                                  className={`p-1 rounded ${isLockedOrder ? 'opacity-50 cursor-not-allowed' : 'bg-[#1C242A] text-white hover:bg-red-500/20'}`}
                                  disabled={isLockedOrder}
                                >
                                  <FaMinus size={12} />
                                </button>
                                <span className="text-white min-w-[20px] text-center">{item.quantity}</span>
                                <button 
                                  onClick={() => addToCart(item)} 
                                  className="bg-[#1C242A] text-white hover:bg-green-500/20 p-1 rounded"
                                >
                                  <FaPlus size={12} />
                                </button>
                                <button 
                                  onClick={() => deleteFromCart(item.id)} 
                                  className={`p-1 rounded ${isLockedOrder ? 'opacity-50 cursor-not-allowed' : 'bg-[#1C242A] text-red-400 hover:text-red-300'}`}
                                  disabled={isLockedOrder}
                                >
                                  <FaTrash size={12} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    {/* Beverage Items */}
                    {splitCartByCategory().beverageItems.length > 0 && (
                      <div className="mb-2">
                        <div className="text-xs text-blue-400 font-semibold flex items-center gap-1 mb-1">
                          <FaCoffee /> Beverage Items
                          <span className="text-[10px] bg-blue-500/20 px-1.5 py-0.5 rounded ml-1">
                            {splitCartByCategory().beverageItems.length} items
                          </span>
                        </div>
                        {splitCartByCategory().beverageItems.map(item => {
                          const isLockedOrder = isOrderLocked && editingOrderId === lockedOrderId;
                          return (
                            <div key={item.id} className="flex items-center justify-between py-2 border-b border-white/5">
                              <div className="flex-1">
                                <p className="text-white text-sm font-medium">{item.name}</p>
                                <p className="text-amber-500 text-xs">₹{item.price} × {item.quantity}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => removeFromCart(item.id)} 
                                  className={`p-1 rounded ${isLockedOrder ? 'opacity-50 cursor-not-allowed' : 'bg-[#1C242A] text-white hover:bg-red-500/20'}`}
                                  disabled={isLockedOrder}
                                >
                                  <FaMinus size={12} />
                                </button>
                                <span className="text-white min-w-[20px] text-center">{item.quantity}</span>
                                <button 
                                  onClick={() => addToCart(item)} 
                                  className="bg-[#1C242A] text-white hover:bg-green-500/20 p-1 rounded"
                                >
                                  <FaPlus size={12} />
                                </button>
                                <button 
                                  onClick={() => deleteFromCart(item.id)} 
                                  className={`p-1 rounded ${isLockedOrder ? 'opacity-50 cursor-not-allowed' : 'bg-[#1C242A] text-red-400 hover:text-red-300'}`}
                                  disabled={isLockedOrder}
                                >
                                  <FaTrash size={12} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    {/* Other KOT Items */}
                    {splitCartByCategory().otherItems.length > 0 && (
                      <div className="mb-2">
                        <div className="text-xs text-purple-400 font-semibold flex items-center gap-1 mb-1">
                          <FaUtensils /> Other KOT Items
                          <span className="text-[10px] bg-purple-500/20 px-1.5 py-0.5 rounded ml-1">
                            {splitCartByCategory().otherItems.length} items
                          </span>
                        </div>
                        {splitCartByCategory().otherItems.map(item => {
                          const isLockedOrder = isOrderLocked && editingOrderId === lockedOrderId;
                          return (
                            <div key={item.id} className="flex items-center justify-between py-2 border-b border-white/5">
                              <div className="flex-1">
                                <p className="text-white text-sm font-medium">{item.name}</p>
                                <p className="text-amber-500 text-xs">₹{item.price} × {item.quantity}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => removeFromCart(item.id)} 
                                  className={`p-1 rounded ${isLockedOrder ? 'opacity-50 cursor-not-allowed' : 'bg-[#1C242A] text-white hover:bg-red-500/20'}`}
                                  disabled={isLockedOrder}
                                >
                                  <FaMinus size={12} />
                                </button>
                                <span className="text-white min-w-[20px] text-center">{item.quantity}</span>
                                <button 
                                  onClick={() => addToCart(item)} 
                                  className="bg-[#1C242A] text-white hover:bg-green-500/20 p-1 rounded"
                                >
                                  <FaPlus size={12} />
                                </button>
                                <button 
                                  onClick={() => deleteFromCart(item.id)} 
                                  className={`p-1 rounded ${isLockedOrder ? 'opacity-50 cursor-not-allowed' : 'bg-[#1C242A] text-red-400 hover:text-red-300'}`}
                                  disabled={isLockedOrder}
                                >
                                  <FaTrash size={12} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    {isOrderLocked && editingOrderId === lockedOrderId && (
                      <div className="mt-3 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                        <p className="text-yellow-400 text-xs flex items-center gap-1">
                          <FaLock size={10} /> Order locked - Only adding new items is allowed
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-amber-500 mb-1">Order Note</label>
                <textarea
                  value={orderNote}
                  onChange={(e) => setOrderNote(e.target.value)}
                  className="w-full bg-[#1C242A] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500"
                  placeholder="Special instructions..."
                  rows="2"
                />
              </div>

              <div className="border-t border-white/10 pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-400 text-sm">Kitchen Items</span>
                  <span className="text-orange-400 font-bold">
                    ₹{splitCartByCategory().kitchenItems.reduce((sum, item) => sum + (parseFloat(item.price) || 0) * (item.quantity || 0), 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-400 text-sm">Beverages</span>
                  <span className="text-blue-400 font-bold">
                    ₹{splitCartByCategory().beverageItems.reduce((sum, item) => sum + (parseFloat(item.price) || 0) * (item.quantity || 0), 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-400 text-sm">Other KOT Items</span>
                  <span className="text-purple-400 font-bold">
                    ₹{splitCartByCategory().otherItems.reduce((sum, item) => sum + (parseFloat(item.price) || 0) * (item.quantity || 0), 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2 pt-2 border-t border-white/5">
                  <span className="text-gray-400 text-sm">Subtotal</span>
                  <span className="text-amber-500 font-bold">₹{calculateSubtotal().toFixed(2)}</span>
                </div>
                {deliveryCharge > 0 && (
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-400 text-sm">Delivery Charge</span>
                    <span className="text-green-400 font-bold">+₹{deliveryCharge.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center mb-4 pt-2 border-t border-white/5">
                  <span className="text-white font-semibold">Total:</span>
                  <span className="text-amber-500 font-bold text-xl">₹{calculateTotal().toFixed(2)}</span>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <button
                      onClick={handlePlaceOrder}
                      disabled={cart.length === 0 || !staffName || (orderType === "dine-in" && !tableNumber) || (orderType === "home-delivery" && !deliveryAddress)}
                      className={`flex-1 px-4 py-2.5 rounded-lg font-semibold transition ${
                        cart.length > 0 && staffName && ((orderType === "dine-in" && tableNumber) || (orderType === "home-delivery" && deliveryAddress) || orderType === "takeaway")
                          ? 'bg-amber-500 text-black hover:bg-amber-400'
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      Place Order
                    </button>
                    <button
                      onClick={printOrder}
                      disabled={cart.length === 0}
                      className={`px-4 py-2.5 rounded-lg font-semibold transition flex items-center gap-2 ${
                        cart.length > 0 ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <FaPrint />
                    </button>
                  </div>
                  <button
                    onClick={saveOrderAsDraft}
                    disabled={cart.length === 0 || (orderType === "dine-in" && !tableNumber) || (orderType === "home-delivery" && !deliveryAddress) || syncing}
                    className={`w-full px-4 py-2 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
                      cart.length > 0 && ((orderType === "dine-in" && tableNumber) || (orderType === "home-delivery" && deliveryAddress) || orderType === "takeaway") && !syncing
                        ? 'bg-purple-600 text-white hover:bg-purple-500'
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <FaSave /> {editingOrderId && isOrderLocked ? 'Update Locked Order' : editingOrderId ? 'Update Draft' : 'Save as Draft'}
                  </button>
                  {isOrderLocked && editingOrderId === lockedOrderId && (
                    <button
                      onClick={() => alert("Order is locked. You can only add more items. Use 'Start New Order' to take orders for other tables.")}
                      className="w-full px-4 py-2 rounded-lg font-semibold bg-yellow-600 text-white hover:bg-yellow-500 transition flex items-center justify-center gap-2 text-sm"
                    >
                      <FaLock /> Locked - Add Only
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transfer Modal */}
      {showTransferModal && transferOrder && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#2A2A2A] rounded-xl max-w-md w-full border border-blue-500/30 shadow-2xl">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-500/20 p-3 rounded-full">
                  <FaExchangeAlt className="text-blue-500 text-2xl" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Transfer Table</h2>
                  <p className="text-gray-400 text-sm">Move order from one table to another</p>
                </div>
              </div>

              <div className="bg-[#1C242A] rounded-lg p-4 mb-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-semibold text-amber-500 mb-1">From Table</label>
                    <div className="bg-[#2A2A2A] rounded-lg px-3 py-2 text-white border border-white/10">
                      Table {transferOrder.tableNumber}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">This table will become vacant after transfer</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-amber-500 mb-1">To Table *</label>
                    <select
                      value={transferToTable}
                      onChange={(e) => setTransferToTable(e.target.value)}
                      className="w-full bg-[#1C242A] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 appearance-none"
                    >
                      <option value="">Select destination table</option>
                      {tableNumbers.map(num => (
                        <option key={num} value={num}>
                          Table {num} {num === parseInt(transferFromTable) ? '(Current)' : ''}
                        </option>
                      ))}
                    </select>
                    {transferToTable && parseInt(transferToTable) === parseInt(transferFromTable) && (
                      <p className="text-yellow-500 text-xs mt-1">⚠️ This is the same table</p>
                    )}
                  </div>

                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2">
                    <p className="text-yellow-400 text-xs flex items-center gap-1">
                      <FaExclamationTriangle size={12} /> 
                      {transferOrder.items ? transferOrder.items.length : 0} items will be moved to the new table
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowTransferModal(false);
                    setTransferOrder(null);
                    setTransferToTable("");
                  }}
                  className="flex-1 bg-gray-600 text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-gray-500 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmTransferTable}
                  disabled={!transferToTable || parseInt(transferToTable) === parseInt(transferFromTable)}
                  className={`flex-1 px-4 py-2.5 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
                    transferToTable && parseInt(transferToTable) !== parseInt(transferFromTable)
                      ? 'bg-blue-600 text-white hover:bg-blue-500'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <FaArrowRight /> Transfer Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KOT Print Modal - Shows different KOT types */}
      {showKOTModal && kotData && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-10">
              <h2 className={`text-xl font-bold ${kotType === 'kitchen' ? 'text-orange-600' : 'text-blue-600'}`}>
                {kotType === 'kitchen' ? '🍳 Kitchen Order Ticket' : '☕ Beverage Order Ticket'}
              </h2>
              <button onClick={closeKOTModal} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
            </div>

            <div className="p-6 kot-content" id="kot-content">
              <div className="text-center border-b-2 border-black pb-4 mb-4">
                <h2 className={`text-xl font-bold ${kotType === 'kitchen' ? 'text-orange-600' : 'text-blue-600'}`}>
                  Café Élan
                </h2>
                <p className="text-gray-600 text-md">
                  {kotType === 'kitchen' ? 'KITCHEN ORDER TICKET' : 'BEVERAGE ORDER TICKET'}
                </p>
              </div>

              <div className="mb-4 space-y-1 text-md">
                <div className="flex justify-between border-b border-gray-300 pb-1">
                  <span className="text-gray-600">KOT #:</span>
                  <span className="text-black font-semibold">{kotData.kotNumber}</span>
                </div>
                <div className="flex justify-between border-b border-gray-300 pb-1">
                  <span className="text-gray-600">Table:</span>
                  <span className="text-black font-semibold">{kotData.orderType === 'dine-in' ? kotData.tableNumber : kotData.orderType}</span>
                </div>
                <div className="flex justify-between border-b border-gray-300 pb-1">
                  <span className="text-gray-600">Staff:</span>
                  <span className="text-black">{kotData.staffName}</span>
                </div>
                <div className="flex justify-between border-b border-gray-300 pb-1">
                  <span className="text-gray-600">Date/Time:</span>
                  <span className="text-black">{kotData.timestamp}</span>
                </div>
                {kotData.note && (
                  <div className="flex justify-between border-b border-gray-300 pb-1">
                    <span className="text-gray-600">Note:</span>
                    <span className="text-black">{kotData.note}</span>
                  </div>
                )}
              </div>

              <div className="border-t-2 border-black pt-3 mb-3">
                <h3 className={`text-md font-semibold ${kotType === 'kitchen' ? 'text-orange-600' : 'text-blue-600'} mb-2`}>
                  {kotType === 'kitchen' ? '🍳 Kitchen Items' : '☕ Beverage Items'}
                </h3>
                <div className="space-y-1">
                  {kotData.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center py-1 border-b border-gray-200 text-md">
                      <div>
                        <span className="text-black">{item.name}</span>
                        <span className="text-gray-500 ml-2">×{item.quantity}</span>
                      </div>
                      <span className="text-amber-500 font-semibold">₹{(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t-2 border-black pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-black font-bold text-lg">Total</span>
                  <span className={`font-bold text-xl ${kotType === 'kitchen' ? 'text-orange-600' : 'text-blue-600'}`}>
                    ₹{kotData.total.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="text-center border-t-2 border-black pt-4 mt-4">
                <p className="text-gray-500 text-[10px]">KOT generated on {new Date().toLocaleString()}</p>
              </div>
            </div>

            <div className="flex gap-2 p-4 border-t sticky bottom-0 bg-white">
              <button
                onClick={printKOTContent}
                className={`flex-1 text-white px-4 py-2 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
                  kotType === 'kitchen' ? 'bg-orange-600 hover:bg-orange-500' : 'bg-blue-600 hover:bg-blue-500'
                }`}
              >
                <FaPrintIcon /> Print KOT
              </button>
              <button
                onClick={closeKOTModal}
                className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-500 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        @media print {
          /* Hide everything except the KOT content */
          body * {
            visibility: hidden !important;
          }
          
          /* Show KOT content and its children */
          .kot-content, .kot-content * {
            visibility: visible !important;
          }
          
          /* Position KOT content for print */
          .kot-content {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 400px !important;
            background: white !important;
            color: black !important;
            padding: 20px !important;
            margin: 0 auto !important;
            z-index: 9999 !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
          }
          
          /* Ensure all text is black for print */
          .kot-content * {
            color: black !important;
          }
          
          /* Hide the modal overlay and buttons when printing */
          .fixed.inset-0.bg-black\\/70 {
            background: white !important;
          }
          
          /* Hide the close button and header when printing */
          .sticky.top-0.bg-white,
          .flex.gap-2.p-4.border-t {
            display: none !important;
          }
          
          /* Ensure KOT content takes full page */
          .kot-content {
            min-height: 100vh !important;
          }
        }
        
        @media (min-width: 480px) {
          .xs\\:inline {
            display: inline !important;
          }
          .xs\\:hidden {
            display: none !important;
          }
        }
        
        @media (max-width: 479px) {
          .xs\\:inline {
            display: none !important;
          }
          .xs\\:hidden {
            display: inline !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ServiceStaff;