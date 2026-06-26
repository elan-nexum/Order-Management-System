// OrdersView.jsx - Consolidated orders per table with item tracking checkboxes
import React, { useState, useEffect, useRef } from "react";
import {
  FaCheck, FaTimes, FaTrash, FaArrowLeft, FaPrint, FaReceipt,
  FaUser, FaClock, FaHistory, FaPlus, FaMinus, FaPercent,
  FaRupeeSign, FaFileInvoice, FaEdit, FaSave,
  FaCalculator, FaPrint as FaPrintIcon, FaGift,
  FaFileExcel, FaSync, FaSearch,
  FaCheckSquare, FaRegSquare, FaExclamationTriangle,
  FaCopy, FaUsers, FaBoxOpen, FaBox
} from "react-icons/fa";
import logoDark from "../assets/logo-dark.png";

const OrdersView = () => {
  // Order States
  const [orders, setOrders] = useState([]);
  const [draftOrders, setDraftOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState("pending");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDrafts, setShowDrafts] = useState(false);
  const [showBillModal, setShowBillModal] = useState(false);
  const [billOrder, setBillOrder] = useState(null);
  const [billType, setBillType] = useState("single");
  const [billTableOrders, setBillTableOrders] = useState([]);
  const [discountType, setDiscountType] = useState("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [discountReason, setDiscountReason] = useState("");
  const [showDiscountInput, setShowDiscountInput] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [editItems, setEditItems] = useState([]);
  const [showComplimentary, setShowComplimentary] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedTables, setExpandedTables] = useState({});
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [showSelectionMode, setShowSelectionMode] = useState(false);
  const [showOrderHistory, setShowOrderHistory] = useState({});
  
  // Item tracking state
  const [itemTracking, setItemTracking] = useState({});
  const [showItemTracking, setShowItemTracking] = useState({});
  const [newItemsCount, setNewItemsCount] = useState({});
  
  // Use ref to track previous orders for comparison
  const prevOrdersRef = useRef([]);

  const API_BASE_URL = 'http://localhost:5000/api';

  useEffect(() => {
    loadAllOrders();
    loadItemTracking();
  }, []);

  // Load item tracking from localStorage
  const loadItemTracking = () => {
    try {
      const saved = localStorage.getItem("itemTracking");
      if (saved) {
        setItemTracking(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading item tracking:', error);
    }
  };

  // Save item tracking to localStorage
  const saveItemTracking = (trackingData) => {
    try {
      localStorage.setItem("itemTracking", JSON.stringify(trackingData));
    } catch (error) {
      console.error('Error saving item tracking:', error);
    }
  };

  // Toggle item tracking status - REMOVED confirmation modal
  const toggleItemTracking = (orderId, itemId, tableNumber) => {
    const trackingKey = `${orderId}-${itemId}`;
    const currentTracking = itemTracking[trackingKey] || { delivered: false, notes: [], quantityDelivered: 0 };
    
    // Toggle delivered status
    const newDelivered = !currentTracking.delivered;
    
    // Create note based on action
    const now = new Date();
    const timestamp = now.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    let note = '';
    if (newDelivered) {
      note = `✅ Delivered on ${timestamp}`;
    } else {
      note = `🔄 Re-opened on ${timestamp}`;
    }
    
    // Get current quantity from order
    const displayOrders = getAllDisplayOrders();
    const order = displayOrders.find(o => o.id === orderId);
    let itemQuantity = 0;
    if (order && order.items) {
      const item = order.items.find(i => (i.id || i.name) === itemId);
      if (item) {
        itemQuantity = item.quantity || 1;
      }
    }
    
    const updatedTracking = {
      delivered: newDelivered,
      notes: [...currentTracking.notes, note],
      quantityDelivered: newDelivered ? itemQuantity : 0,
      lastUpdated: timestamp,
      itemName: currentTracking.itemName || '',
      orderId: orderId,
      itemId: itemId
    };
    
    // Update tracking
    const newTracking = {
      ...itemTracking,
      [trackingKey]: updatedTracking
    };
    
    setItemTracking(newTracking);
    saveItemTracking(newTracking);
    
    // REMOVED: No alert/confirmation modal
  };

  // Add note for new orders received - KEEP TICKED STATUS
  const addNewOrderNote = (orderId, itemId, newQuantity, previousQuantity, tableNumber) => {
    const trackingKey = `${orderId}-${itemId}`;
    const currentTracking = itemTracking[trackingKey] || { delivered: false, notes: [], quantityDelivered: 0 };
    
    const now = new Date();
    const timestamp = now.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const added = newQuantity - previousQuantity;
    
    // Track new items count for notification
    const itemName = currentTracking.itemName || 'Item';
    const newItemsKey = `${orderId}-${itemId}`;
    setNewItemsCount(prev => ({
      ...prev,
      [newItemsKey]: {
        count: added,
        timestamp: timestamp,
        itemName: itemName,
        total: newQuantity
      }
    }));
    
    // KEEP DELIVERED STATUS - don't untick
    const note = `🆕 ${added} new item(s) added on ${timestamp}. Total now: ${newQuantity}`;
    
    // Keep existing delivered status and just add note
    const updatedTracking = {
      ...currentTracking,
      // Don't change delivered status - keep as is
      notes: [...currentTracking.notes, note],
      lastUpdated: timestamp,
      quantityDelivered: currentTracking.delivered ? newQuantity : 0 // Update quantity if delivered
    };
    
    const newTracking = {
      ...itemTracking,
      [trackingKey]: updatedTracking
    };
    
    setItemTracking(newTracking);
    saveItemTracking(newTracking);
    
    // Clear notification after 5 seconds
    setTimeout(() => {
      setNewItemsCount(prev => {
        const newState = { ...prev };
        delete newState[newItemsKey];
        return newState;
      });
    }, 5000);
  };

  const loadAllOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      await loadOrders();
      await loadDraftOrders();
    } catch (error) {
      console.error('Error loading orders:', error);
      setError('Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders`);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          // Store previous orders before updating
          const prevOrders = prevOrdersRef.current;
          setOrders(data);
          // Check for new items added and update tracking
          updateItemTrackingForNewOrders(data, prevOrders);
          // Update ref
          prevOrdersRef.current = data;
        } else {
          console.error('Orders data is not an array:', data);
          setOrders([]);
        }
      } else {
        console.error('Failed to fetch orders:', response.status);
        setOrders([]);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      setOrders([]);
    }
  };

  // Check for new items added and update tracking - KEEP TICKED STATUS
  const updateItemTrackingForNewOrders = (ordersData, prevOrdersData) => {
    // Get current tracking from localStorage directly to avoid stale state
    let currentTracking = {};
    try {
      const saved = localStorage.getItem("itemTracking");
      if (saved) {
        currentTracking = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error loading tracking for update:', error);
    }
    
    let trackingUpdated = false;
    const newItemsNotifications = {};
    
    // Get all display orders (consolidated) from new data
    const pendingConsolidated = getConsolidatedOrdersFromData(ordersData);
    const displayOrders = Object.values(pendingConsolidated);
    
    // Get previous orders for comparison
    const prevPendingConsolidated = getConsolidatedOrdersFromData(prevOrdersData || []);
    const prevDisplayOrders = Object.values(prevPendingConsolidated);
    
    // Create a map of previous quantities for comparison
    const prevQuantities = {};
    prevDisplayOrders.forEach(order => {
      if (order && order.items) {
        order.items.forEach(item => {
          const key = `${order.id}-${item.id || item.name}`;
          prevQuantities[key] = item.quantity || 1;
        });
      }
    });
    
    displayOrders.forEach(order => {
      if (order && order.items) {
        order.items.forEach(item => {
          const trackingKey = `${order.id}-${item.id || item.name}`;
          const itemId = item.id || item.name;
          const currentQuantity = item.quantity || 1;
          const prevQuantity = prevQuantities[trackingKey] || 0;
          
          // If quantity increased
          if (currentQuantity > prevQuantity) {
            const added = currentQuantity - prevQuantity;
            const now = new Date();
            const timestamp = now.toLocaleString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
            
            const note = `🆕 ${added} new item(s) added on ${timestamp}. Total now: ${currentQuantity}`;
            
            // Get existing tracking or create new
            const existingTracking = currentTracking[trackingKey] || { 
              delivered: false, 
              notes: [], 
              quantityDelivered: 0,
              itemName: item.name || 'Item',
              orderId: order.id,
              itemId: itemId
            };
            
            // KEEP DELIVERED STATUS - don't change it
            currentTracking[trackingKey] = {
              ...existingTracking,
              // Keep delivered status as is
              notes: [...(existingTracking.notes || []), note],
              lastUpdated: timestamp,
              // If already delivered, keep quantityDelivered as current quantity
              quantityDelivered: existingTracking.delivered ? currentQuantity : 0
            };
            trackingUpdated = true;
            
            // Store notification
            const newItemsKey = `${order.id}-${itemId}`;
            newItemsNotifications[newItemsKey] = {
              count: added,
              timestamp: timestamp,
              itemName: item.name || 'Item',
              total: currentQuantity
            };
          } else if (prevQuantity === 0 && currentQuantity > 0) {
            // New item - initialize tracking
            const now = new Date();
            const timestamp = now.toLocaleString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
            
            currentTracking[trackingKey] = {
              delivered: false,
              notes: [`🆕 Item added on ${timestamp}. Quantity: ${currentQuantity}`],
              quantityDelivered: 0,
              lastUpdated: new Date().toISOString(),
              itemName: item.name || 'Item',
              orderId: order.id,
              itemId: itemId
            };
            trackingUpdated = true;
          }
        });
      }
    });
    
    if (trackingUpdated) {
      setItemTracking(currentTracking);
      saveItemTracking(currentTracking);
      
      // Set new items notifications
      setNewItemsCount(newItemsNotifications);
      
      // Clear notifications after 5 seconds
      setTimeout(() => {
        setNewItemsCount({});
      }, 5000);
    }
  };

  // Helper to get consolidated orders from data (used for tracking)
  const getConsolidatedOrdersFromData = (ordersData) => {
    const consolidated = {};
    
    // Group pending orders by table
    ordersData.forEach(order => {
      if (order && order.status === 'pending') {
        const table = order.tableNumber || 'No Table';
        if (!consolidated[table]) {
          consolidated[table] = [];
        }
        consolidated[table].push(order);
      }
    });

    // Create consolidated order for each table
    const result = {};
    Object.keys(consolidated).forEach(table => {
      const tableOrders = consolidated[table];
      if (tableOrders.length > 0) {
        const combinedItems = {};
        let orderCount = 0;
        let staffName = tableOrders[0]?.staffName || 'Unknown';
        let numberOfGuests = tableOrders[0]?.numberOfGuests || 1;
        let orderType = tableOrders[0]?.orderType || 'dine-in';
        let latestTimestamp = tableOrders[0]?.timestamp || new Date().toISOString();
        let allNotes = [];

        tableOrders.forEach((order, idx) => {
          orderCount++;
          if (order.staffName) staffName = order.staffName;
          if (order.numberOfGuests) numberOfGuests = order.numberOfGuests;
          if (order.orderType) orderType = order.orderType;
          if (order.timestamp && order.timestamp > latestTimestamp) {
            latestTimestamp = order.timestamp;
          }
          if (order.note) allNotes.push(`Order ${idx + 1}: ${order.note}`);

          if (order.items) {
            order.items.forEach(item => {
              const key = item.id || item.name;
              if (combinedItems[key]) {
                combinedItems[key].quantity += item.quantity || 1;
              } else {
                combinedItems[key] = { 
                  ...item, 
                  quantity: item.quantity || 1,
                  orderIds: [order.id]
                };
              }
              if (combinedItems[key] && !combinedItems[key].orderIds) {
                combinedItems[key].orderIds = [order.id];
              } else if (combinedItems[key] && combinedItems[key].orderIds) {
                if (!combinedItems[key].orderIds.includes(order.id)) {
                  combinedItems[key].orderIds.push(order.id);
                }
              }
            });
          }
        });

        const consolidatedItems = Object.values(combinedItems);
        const total = consolidatedItems.reduce((sum, item) => {
          return sum + (parseFloat(item.price) || 0) * (item.quantity || 0);
        }, 0);

        result[table] = {
          id: `consolidated-${table}`,
          tableNumber: table === 'No Table' ? null : parseInt(table),
          numberOfGuests: numberOfGuests,
          items: consolidatedItems,
          total: total,
          subtotal: total,
          staffName: staffName,
          orderType: orderType,
          timestamp: latestTimestamp,
          status: 'pending',
          note: allNotes.join(' | '),
          orderCount: orderCount,
          isConsolidated: true,
          originalOrders: tableOrders,
          customerName: tableOrders[0]?.customerName || '',
          customerPhone: tableOrders[0]?.customerPhone || '',
          deliveryAddress: tableOrders[0]?.deliveryAddress || '',
          deliveryCharge: tableOrders[0]?.deliveryCharge || 0,
          isCompleted: false
        };
      }
    });

    return result;
  };

  const loadDraftOrders = () => {
    try {
      const saved = localStorage.getItem("savedOrders");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const drafts = parsed.filter(order => order && order.status === "draft");
          setDraftOrders(drafts);
        } else {
          setDraftOrders([]);
        }
      } else {
        setDraftOrders([]);
      }
    } catch (error) {
      console.error('Error loading draft orders:', error);
      setDraftOrders([]);
    }
  };

  const syncOrders = async () => {
    setSyncing(true);
    setError(null);
    try {
      await loadOrders();
      await loadDraftOrders();
      alert('✅ Orders synced successfully!');
    } catch (error) {
      console.error('Sync error:', error);
      setError('Failed to sync orders. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  // Consolidated orders per table - combine all pending orders for the same table
  const getConsolidatedOrders = () => {
    const consolidated = {};
    
    // Group pending orders by table
    orders.forEach(order => {
      if (order && order.status === 'pending') {
        const table = order.tableNumber || 'No Table';
        if (!consolidated[table]) {
          consolidated[table] = [];
        }
        consolidated[table].push(order);
      }
    });

    // Create consolidated order for each table
    const result = {};
    Object.keys(consolidated).forEach(table => {
      const tableOrders = consolidated[table];
      if (tableOrders.length > 0) {
        // Combine all items from all orders for this table
        const combinedItems = {};
        let totalSubtotal = 0;
        let orderCount = 0;
        let staffName = tableOrders[0]?.staffName || 'Unknown';
        let numberOfGuests = tableOrders[0]?.numberOfGuests || 1;
        let orderType = tableOrders[0]?.orderType || 'dine-in';
        let latestTimestamp = tableOrders[0]?.timestamp || new Date().toISOString();
        let allNotes = [];

        tableOrders.forEach((order, idx) => {
          orderCount++;
          if (order.staffName) staffName = order.staffName;
          if (order.numberOfGuests) numberOfGuests = order.numberOfGuests;
          if (order.orderType) orderType = order.orderType;
          if (order.timestamp && order.timestamp > latestTimestamp) {
            latestTimestamp = order.timestamp;
          }
          if (order.note) allNotes.push(`Order ${idx + 1}: ${order.note}`);

          if (order.items) {
            order.items.forEach(item => {
              const key = item.id || item.name;
              if (combinedItems[key]) {
                combinedItems[key].quantity += item.quantity || 1;
              } else {
                combinedItems[key] = { 
                  ...item, 
                  quantity: item.quantity || 1,
                  // Keep track of which order this came from for history
                  orderIds: [order.id]
                };
              }
              // Add order ID to track history
              if (combinedItems[key] && !combinedItems[key].orderIds) {
                combinedItems[key].orderIds = [order.id];
              } else if (combinedItems[key] && combinedItems[key].orderIds) {
                if (!combinedItems[key].orderIds.includes(order.id)) {
                  combinedItems[key].orderIds.push(order.id);
                }
              }
            });
          }
        });

        const consolidatedItems = Object.values(combinedItems);
        const total = consolidatedItems.reduce((sum, item) => {
          return sum + (parseFloat(item.price) || 0) * (item.quantity || 0);
        }, 0);

        result[table] = {
          id: `consolidated-${table}`,
          tableNumber: table === 'No Table' ? null : parseInt(table),
          numberOfGuests: numberOfGuests,
          items: consolidatedItems,
          total: total,
          subtotal: total,
          staffName: staffName,
          orderType: orderType,
          timestamp: latestTimestamp,
          status: 'pending',
          note: allNotes.join(' | '),
          orderCount: orderCount,
          isConsolidated: true,
          originalOrders: tableOrders,
          customerName: tableOrders[0]?.customerName || '',
          customerPhone: tableOrders[0]?.customerPhone || '',
          deliveryAddress: tableOrders[0]?.deliveryAddress || '',
          deliveryCharge: tableOrders[0]?.deliveryCharge || 0,
          isCompleted: false
        };
      }
    });

    return result;
  };

  // Get consolidated completed orders by table
  const getConsolidatedCompletedOrders = () => {
    const consolidated = {};
    
    // Group completed orders by table
    orders.forEach(order => {
      if (order && order.status === 'completed') {
        const table = order.tableNumber || 'No Table';
        if (!consolidated[table]) {
          consolidated[table] = [];
        }
        consolidated[table].push(order);
      }
    });

    // Create consolidated completed order for each table
    const result = {};
    Object.keys(consolidated).forEach(table => {
      const tableOrders = consolidated[table];
      if (tableOrders.length > 0) {
        // Combine all items from all completed orders for this table
        const combinedItems = {};
        let totalSubtotal = 0;
        let orderCount = 0;
        let staffName = tableOrders[0]?.staffName || 'Unknown';
        let numberOfGuests = tableOrders[0]?.numberOfGuests || 1;
        let orderType = tableOrders[0]?.orderType || 'dine-in';
        let latestTimestamp = tableOrders[0]?.timestamp || new Date().toISOString();
        let allNotes = [];

        tableOrders.forEach((order, idx) => {
          orderCount++;
          if (order.staffName) staffName = order.staffName;
          if (order.numberOfGuests) numberOfGuests = order.numberOfGuests;
          if (order.orderType) orderType = order.orderType;
          if (order.timestamp && order.timestamp > latestTimestamp) {
            latestTimestamp = order.timestamp;
          }
          if (order.note) allNotes.push(`Order ${idx + 1}: ${order.note}`);

          if (order.items) {
            order.items.forEach(item => {
              const key = item.id || item.name;
              if (combinedItems[key]) {
                combinedItems[key].quantity += item.quantity || 1;
              } else {
                combinedItems[key] = { 
                  ...item, 
                  quantity: item.quantity || 1,
                  orderIds: [order.id]
                };
              }
              if (combinedItems[key] && !combinedItems[key].orderIds) {
                combinedItems[key].orderIds = [order.id];
              } else if (combinedItems[key] && combinedItems[key].orderIds) {
                if (!combinedItems[key].orderIds.includes(order.id)) {
                  combinedItems[key].orderIds.push(order.id);
                }
              }
            });
          }
        });

        const consolidatedItems = Object.values(combinedItems);
        const total = consolidatedItems.reduce((sum, item) => {
          return sum + (parseFloat(item.price) || 0) * (item.quantity || 0);
        }, 0);

        result[table] = {
          id: `consolidated-completed-${table}`,
          tableNumber: table === 'No Table' ? null : parseInt(table),
          numberOfGuests: numberOfGuests,
          items: consolidatedItems,
          total: total,
          subtotal: total,
          staffName: staffName,
          orderType: orderType,
          timestamp: latestTimestamp,
          status: 'completed',
          note: allNotes.join(' | '),
          orderCount: orderCount,
          isConsolidated: true,
          originalOrders: tableOrders,
          customerName: tableOrders[0]?.customerName || '',
          customerPhone: tableOrders[0]?.customerPhone || '',
          deliveryAddress: tableOrders[0]?.deliveryAddress || '',
          deliveryCharge: tableOrders[0]?.deliveryCharge || 0,
          isCompleted: true
        };
      }
    });

    return result;
  };

  // Get all orders (including non-consolidated for completed/cancelled)
  const getAllDisplayOrders = () => {
    const pendingConsolidated = getConsolidatedOrders();
    const completedConsolidated = getConsolidatedCompletedOrders();
    const displayOrders = [];
    
    // Add consolidated pending orders
    Object.values(pendingConsolidated).forEach(order => {
      displayOrders.push(order);
    });

    // Add consolidated completed orders
    Object.values(completedConsolidated).forEach(order => {
      displayOrders.push(order);
    });

    // Add cancelled orders individually
    orders.forEach(order => {
      if (order && order.status === 'cancelled') {
        displayOrders.push(order);
      }
    });

    return displayOrders;
  };

  const toggleOrderHistory = (tableNumber) => {
    setShowOrderHistory(prev => ({
      ...prev,
      [tableNumber]: !prev[tableNumber]
    }));
  };

  // Toggle item tracking visibility
  const toggleItemTrackingVisibility = (tableNumber) => {
    setShowItemTracking(prev => ({
      ...prev,
      [tableNumber]: !prev[tableNumber]
    }));
  };

  const toggleOrderSelection = (orderId) => {
    setSelectedOrders(prev => {
      if (prev.includes(orderId)) {
        return prev.filter(id => id !== orderId);
      } else {
        return [...prev, orderId];
      }
    });
  };

  const clearSelection = () => {
    setSelectedOrders([]);
  };

  const getSelectedOrderDetails = () => {
    const displayOrders = getAllDisplayOrders();
    const selected = displayOrders.filter(order => selectedOrders.includes(order.id));
    const totalAmount = selected.reduce((sum, order) => sum + calculateBillableTotal(order.items), 0);
    const itemCount = selected.reduce((sum, order) => sum + (order.items ? order.items.length : 0), 0);
    
    const combinedItems = {};
    selected.forEach(order => {
      if (order.items) {
        order.items.forEach(item => {
          const key = item.id || item.name;
          if (combinedItems[key]) {
            combinedItems[key].quantity += item.quantity || 1;
          } else {
            combinedItems[key] = { ...item, quantity: item.quantity || 1 };
          }
        });
      }
    });
    
    return {
      orders: selected,
      totalAmount,
      itemCount,
      combinedItems: Object.values(combinedItems)
    };
  };

  const bulkComplete = async () => {
    if (selectedOrders.length === 0) {
      alert('Please select at least one order to complete.');
      return;
    }
    
    if (!window.confirm(`Complete ${selectedOrders.length} selected order(s)?`)) return;
    
    // For consolidated orders, we need to complete all original orders
    const displayOrders = getAllDisplayOrders();
    const ordersToComplete = [];
    
    selectedOrders.forEach(orderId => {
      const order = displayOrders.find(o => o.id === orderId);
      if (order) {
        if (order.isConsolidated && order.originalOrders) {
          order.originalOrders.forEach(orig => {
            ordersToComplete.push(orig.id);
          });
        } else {
          ordersToComplete.push(order.id);
        }
      }
    });

    for (const orderId of ordersToComplete) {
      try {
        await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'completed' })
        });
      } catch (error) {
        console.error('Error completing order:', error);
      }
    }
    
    await loadOrders();
    setSelectedOrders([]);
    alert(`✅ ${selectedOrders.length} order(s) completed successfully!`);
  };

  const bulkCancel = async () => {
    if (selectedOrders.length === 0) {
      alert('Please select at least one order to cancel.');
      return;
    }
    
    if (!window.confirm(`Cancel ${selectedOrders.length} selected order(s)?`)) return;
    
    const displayOrders = getAllDisplayOrders();
    const ordersToCancel = [];
    
    selectedOrders.forEach(orderId => {
      const order = displayOrders.find(o => o.id === orderId);
      if (order) {
        if (order.isConsolidated && order.originalOrders) {
          order.originalOrders.forEach(orig => {
            ordersToCancel.push(orig.id);
          });
        } else {
          ordersToCancel.push(order.id);
        }
      }
    });

    for (const orderId of ordersToCancel) {
      try {
        await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'cancelled' })
        });
      } catch (error) {
        console.error('Error cancelling order:', error);
      }
    }
    
    await loadOrders();
    setSelectedOrders([]);
    alert(`❌ ${selectedOrders.length} order(s) cancelled successfully!`);
  };

  const bulkPrintBill = () => {
    if (selectedOrders.length === 0) {
      alert('Please select at least one order to print bill.');
      return;
    }
    
    const displayOrders = getAllDisplayOrders();
    const selected = displayOrders.filter(order => selectedOrders.includes(order.id));
    const combinedItems = {};
    let totalAmount = 0;
    
    selected.forEach(order => {
      if (order.items) {
        order.items.forEach(item => {
          const key = item.id || item.name;
          if (combinedItems[key]) {
            combinedItems[key].quantity += item.quantity || 1;
          } else {
            combinedItems[key] = { ...item, quantity: item.quantity || 1 };
          }
          totalAmount += parseFloat(item.price) * (item.quantity || 1);
        });
      }
    });
    
    const billData = {
      tableNumber: selected[0]?.tableNumber || 'Multiple',
      items: Object.values(combinedItems),
      total: totalAmount,
      subtotal: totalAmount,
      orderCount: selected.length,
      staffName: selected[0]?.staffName || 'Multiple',
      timestamp: new Date().toISOString(),
      isFullBill: true,
      tableOrders: selected,
      isConsolidated: selected.some(o => o.isConsolidated),
      isBulkPrint: true
    };
    
    setBillOrder(billData);
    setBillType("full");
    setDiscountType("percentage");
    setDiscountValue("");
    setDiscountReason("");
    setShowDiscountInput(false);
    setShowComplimentary(false);
    setShowBillModal(true);
  };

  const markIndividualOrderComplete = async (orderId, originalOrderId = null) => {
    // If orderId is consolidated, we need to handle individual original orders
    const displayOrders = getAllDisplayOrders();
    const consolidatedOrder = displayOrders.find(o => o.id === orderId);
    
    let ordersToComplete = [];
    
    if (consolidatedOrder && consolidatedOrder.isConsolidated && consolidatedOrder.originalOrders) {
      if (originalOrderId) {
        // Complete only the specific original order
        const specificOrder = consolidatedOrder.originalOrders.find(o => o.id === originalOrderId);
        if (specificOrder) {
          ordersToComplete = [specificOrder.id];
        } else {
          alert('Order not found.');
          return;
        }
      } else {
        // Complete all original orders in the consolidated group
        if (!window.confirm(`Complete all ${consolidatedOrder.originalOrders.length} orders for this table?`)) return;
        ordersToComplete = consolidatedOrder.originalOrders.map(o => o.id);
      }
    } else {
      // Single order
      if (!window.confirm('Mark this order as completed?')) return;
      ordersToComplete = [orderId];
    }

    try {
      for (const id of ordersToComplete) {
        const response = await fetch(`${API_BASE_URL}/orders/${id}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'completed' })
        });
        if (!response.ok) {
          console.error(`Failed to complete order ${id}:`, response.status);
        }
      }
      
      await loadOrders();
      alert(`✅ ${ordersToComplete.length} order(s) completed successfully!`);
    } catch (error) {
      console.error('Error completing order:', error);
      alert('❌ Failed to complete order. Please try again.');
    }
  };

  const completeOriginalOrder = async (originalOrderId, tableNumber) => {
    if (!window.confirm('Mark this individual order as completed? The table will remain active if other orders exist.')) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${originalOrderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' })
      });

      if (response.ok) {
        await loadOrders();
        alert('✅ Individual order completed successfully!');
      } else {
        alert('❌ Failed to complete order.');
      }
    } catch (error) {
      console.error('Error completing order:', error);
      alert('❌ Failed to complete order.');
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    if (!window.confirm(`Mark this order as ${status}?`)) return;
    
    // Check if this is a consolidated order
    const displayOrders = getAllDisplayOrders();
    const order = displayOrders.find(o => o.id === orderId);
    
    if (order && order.isConsolidated && order.originalOrders) {
      // Complete all original orders
      for (const origOrder of order.originalOrders) {
        try {
          await fetch(`${API_BASE_URL}/orders/${origOrder.id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
          });
        } catch (error) {
          console.error('Error updating order status:', error);
        }
      }
      await loadOrders();
      alert(`✅ All orders for this table marked as ${status}!`);
    } else {
      // Single order
      try {
        const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status })
        });

        if (response.ok) {
          await loadOrders();
          alert(`✅ Order ${status} successfully!`);
        } else {
          alert("❌ Failed to update order status.");
        }
      } catch (error) {
        console.error('Error updating order:', error);
        alert("❌ Failed to update order status.");
      }
    }
  };

  const deleteOrder = async (orderId) => {
    if (!window.confirm("⚠️ Delete this order permanently?")) return;

    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadOrders();
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(null);
        }
        alert("✅ Order deleted successfully!");
      } else {
        alert("❌ Failed to delete order.");
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      alert("❌ Failed to delete order.");
    }
  };

  const deleteDraftOrder = (orderId) => {
    if (!window.confirm("⚠️ Delete this draft order?")) return;

    try {
      const saved = localStorage.getItem("savedOrders");
      if (saved) {
        const allOrders = JSON.parse(saved);
        const updatedOrders = allOrders.filter(order => order.id !== orderId);
        localStorage.setItem("savedOrders", JSON.stringify(updatedOrders));
        loadDraftOrders();
        alert("✅ Draft order deleted successfully!");
      }
    } catch (error) {
      console.error('Error deleting draft:', error);
      alert("❌ Failed to delete draft order.");
    }
  };

  const continueDraftOrder = (order) => {
    localStorage.setItem("continueOrderId", order.id.toString());
    window.location.href = '/service-staff';
  };

  const hasActiveOrders = (tableNumber) => {
    return orders.some(order =>
      order && order.tableNumber === tableNumber &&
      order.status === 'pending'
    );
  };

  const calculateOrderTotal = (items) => {
    if (!items || !Array.isArray(items) || items.length === 0) return 0;
    return items.reduce((total, item) => {
      const price = parseFloat(item.price) || 0;
      return total + (price * (item.quantity || 0));
    }, 0);
  };

  const calculateBillableTotal = (items) => {
    if (!items || !Array.isArray(items) || items.length === 0) return 0;
    return items.reduce((total, item) => {
      if (!item.isComplimentary) {
        const price = parseFloat(item.price) || 0;
        return total + (price * (item.quantity || 0));
      }
      return total;
    }, 0);
  };

  const calculateComplimentaryTotal = (items) => {
    if (!items || !Array.isArray(items) || items.length === 0) return 0;
    return items.reduce((total, item) => {
      if (item.isComplimentary) {
        const price = parseFloat(item.price) || 0;
        return total + (price * (item.quantity || 0));
      }
      return total;
    }, 0);
  };

  const calculateDiscountedTotal = (total, discountType, discountValue) => {
    if (!discountValue || discountValue === "") return total;
    const value = parseFloat(discountValue);
    if (isNaN(value) || value <= 0) return total;

    if (discountType === "percentage") {
      return total - (total * (value / 100));
    } else {
      return total - value;
    }
  };

  const calculateDiscountAmount = (total, discountType, discountValue) => {
    if (!discountValue || discountValue === "") return 0;
    const value = parseFloat(discountValue);
    if (isNaN(value) || value <= 0) return 0;

    if (discountType === "percentage") {
      return total * (value / 100);
    } else {
      return value;
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const openBillModal = (order, type = "single", isCompleted = false) => {
    setBillType(type);
    
    // Get orders based on type
    let ordersToCombine = [];
    if (isCompleted) {
      // For completed orders, get all completed orders for this table
      ordersToCombine = orders.filter(o =>
        o && o.tableNumber === order.tableNumber &&
        o.status === 'completed'
      );
    } else if (type === "full") {
      // For pending orders, get all pending orders for this table
      ordersToCombine = orders.filter(o =>
        o && o.tableNumber === order.tableNumber &&
        o.status === 'pending'
      );
    } else {
      // Single order
      ordersToCombine = [order];
    }
    
    setBillTableOrders(ordersToCombine);
    
    // Combine items from all orders
    const combinedItems = {};
    ordersToCombine.forEach(o => {
      if (o.items) {
        o.items.forEach(item => {
          const key = item.id || item.name;
          if (combinedItems[key]) {
            combinedItems[key].quantity += item.quantity || 1;
          } else {
            combinedItems[key] = { 
              ...item, 
              quantity: item.quantity || 1 
            };
          }
        });
      }
    });
    
    const allItems = Object.values(combinedItems);
    setBillOrder({
      ...order,
      items: allItems,
      total: calculateBillableTotal(allItems),
      subtotal: calculateOrderTotal(allItems),
      complimentaryTotal: calculateComplimentaryTotal(allItems),
      orderCount: ordersToCombine.length,
      isFullBill: type === "full",
      tableOrders: ordersToCombine,
      isConsolidated: order.isConsolidated || ordersToCombine.length > 1,
      isBulkPrint: false,
      isCompleted: isCompleted,
      originalItems: allItems
    });
    
    setDiscountType("percentage");
    setDiscountValue("");
    setDiscountReason("");
    setShowDiscountInput(false);
    setShowComplimentary(false);
    setShowBillModal(true);
  };

  const closeBillModal = () => {
    setShowBillModal(false);
    setBillOrder(null);
    setBillTableOrders([]);
    setDiscountType("percentage");
    setDiscountValue("");
    setDiscountReason("");
    setShowDiscountInput(false);
    setShowComplimentary(false);
  };

  const printBill = () => {
    window.print();
  };

  const startEditing = (order) => {
    setEditingOrderId(order.id);
    setEditItems(order.items ? order.items.map(item => ({ ...item })) : []);
  };

  const cancelEditing = () => {
    setEditingOrderId(null);
    setEditItems([]);
  };

  const updateItemQuantity = (itemId, change) => {
    setEditItems(prev =>
      prev.map(item => {
        if (item.id === itemId) {
          const newQuantity = Math.max(0, (item.quantity || 0) + change);
          return { ...item, quantity: newQuantity };
        }
        return item;
      }).filter(item => item.quantity > 0)
    );
  };

  const removeEditItem = (itemId) => {
    setEditItems(prev => prev.filter(item => item.id !== itemId));
  };

  const toggleItemComplimentary = (itemId) => {
    setEditItems(prev =>
      prev.map(item =>
        item.id === itemId
          ? { ...item, isComplimentary: !item.isComplimentary }
          : item
      )
    );
  };

  const saveEditedOrder = async (orderId) => {
    if (editItems.length === 0) {
      alert("Order cannot be empty. Add at least one item.");
      return;
    }

    try {
      // Find the order
      const displayOrders = getAllDisplayOrders();
      const orderToUpdate = displayOrders.find(o => o.id === orderId);
      if (!orderToUpdate) {
        alert("Order not found.");
        return;
      }

      if (orderToUpdate.isConsolidated && orderToUpdate.originalOrders) {
        // Update all original orders
        for (const origOrder of orderToUpdate.originalOrders) {
          const updatedOrder = {
            ...origOrder,
            items: editItems,
            total: calculateBillableTotal(editItems),
            subtotal: calculateOrderTotal(editItems),
            complimentaryTotal: calculateComplimentaryTotal(editItems)
          };
          await fetch(`${API_BASE_URL}/orders/${origOrder.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedOrder)
          });
        }
        alert("✅ All orders updated successfully!");
      } else {
        const updatedOrder = {
          ...orderToUpdate,
          items: editItems,
          total: calculateBillableTotal(editItems),
          subtotal: calculateOrderTotal(editItems),
          complimentaryTotal: calculateComplimentaryTotal(editItems)
        };

        const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedOrder)
        });

        if (!response.ok) {
          alert("❌ Failed to update order.");
          return;
        }
      }

      await loadOrders();
      setEditingOrderId(null);
      setEditItems([]);
    } catch (error) {
      console.error('Error saving edited order:', error);
      alert("❌ Failed to update order.");
    }
  };

  const toggleBillItemComplimentary = (itemId) => {
    if (!billOrder) return;
    const updatedItems = billOrder.items.map(item =>
      item.id === itemId
        ? { ...item, isComplimentary: !item.isComplimentary }
        : item
    );
    setBillOrder({
      ...billOrder,
      items: updatedItems,
      total: calculateBillableTotal(updatedItems),
      subtotal: calculateOrderTotal(updatedItems),
      complimentaryTotal: calculateComplimentaryTotal(updatedItems)
    });
  };

  // Updated CSV Export Function - Exports Orders Data
  const downloadCSV = () => {
    try {
      const displayOrders = getAllDisplayOrders();
      const allOrders = showDrafts ? [...draftOrders, ...displayOrders] : displayOrders;
      
      // Filter based on current filter status
      let ordersToExport = allOrders;
      if (filterStatus !== "all") {
        if (filterStatus === "draft") {
          ordersToExport = ordersToExport.filter(order => order && order.status === "draft");
        } else {
          ordersToExport = ordersToExport.filter(order => order && order.status === filterStatus);
        }
      }

      if (ordersToExport.length === 0) {
        alert('No orders to export. Please adjust your filters.');
        return;
      }

      // Prepare CSV data
      const csvRows = [];
      
      // Add headers
      const headers = [
        'Order ID',
        'Table Number',
        'Status',
        'Order Type',
        'Staff Name',
        'Number of Guests',
        'Items',
        'Item Count',
        'Total Amount (₹)',
        'Billable Amount (₹)',
        'Complimentary Amount (₹)',
        'Order Date',
        'Order Time',
        'Customer Name',
        'Customer Phone',
        'Delivery Address',
        'Delivery Charge (₹)',
        'Notes'
      ];
      csvRows.push(headers.join(','));

      // Add data rows
      ordersToExport.forEach(order => {
        if (!order) return;
        
        const items = order.items || [];
        const itemNames = items.map(item => 
          `${item.name} (${item.quantity || 1}${item.isComplimentary ? ' - Comp' : ''})`
        ).join('; ');
        
        const totalAmount = calculateOrderTotal(items);
        const billableAmount = calculateBillableTotal(items);
        const complimentaryAmount = calculateComplimentaryTotal(items);
        const itemCount = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
        
        const date = order.timestamp ? new Date(order.timestamp) : new Date();
        const orderDate = date.toLocaleDateString('en-IN');
        const orderTime = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

        const row = [
          order.id || 'N/A',
          order.tableNumber || 'N/A',
          order.status || 'N/A',
          order.orderType || 'dine-in',
          order.staffName || 'N/A',
          order.numberOfGuests || 1,
          `"${itemNames}"`,
          itemCount,
          totalAmount.toFixed(2),
          billableAmount.toFixed(2),
          complimentaryAmount.toFixed(2),
          orderDate,
          orderTime,
          order.customerName || 'N/A',
          order.customerPhone || 'N/A',
          order.deliveryAddress || 'N/A',
          (order.deliveryCharge || 0).toFixed(2),
          `"${(order.note || '').replace(/"/g, '""')}"`
        ];
        
        csvRows.push(row.join(','));
      });

      // Create CSV content
      const csvContent = csvRows.join('\n');
      
      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      
      // Generate filename with date
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
      const filename = `orders_export_${dateStr}_${timeStr}.csv`;
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      alert(`✅ ${ordersToExport.length} order(s) exported successfully!`);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('❌ Failed to export orders. Please try again.');
    }
  };

  const getFilteredOrders = () => {
    const pendingConsolidated = getConsolidatedOrders();
    const completedConsolidated = getConsolidatedCompletedOrders();
    const displayOrders = [];
    
    // Add consolidated pending orders first (Active orders)
    Object.values(pendingConsolidated).forEach(order => {
      displayOrders.push(order);
    });

    // Add consolidated completed orders
    Object.values(completedConsolidated).forEach(order => {
      displayOrders.push(order);
    });

    // Add cancelled orders individually
    orders.forEach(order => {
      if (order && order.status === 'cancelled') {
        displayOrders.push(order);
      }
    });

    let allOrders = [...displayOrders];

    if (showDrafts) {
      allOrders = [...draftOrders, ...allOrders];
    }

    if (filterStatus !== "all") {
      if (filterStatus === "draft") {
        allOrders = allOrders.filter(order => order && order.status === "draft");
      } else {
        allOrders = allOrders.filter(order => order && order.status === filterStatus);
      }
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      allOrders = allOrders.filter(order => {
        if (!order) return false;
        const tableMatch = order.tableNumber && String(order.tableNumber).includes(query);
        const staffMatch = order.staffName && order.staffName.toLowerCase().includes(query);
        const noteMatch = order.note && order.note.toLowerCase().includes(query);
        const orderTypeMatch = order.orderType && order.orderType.toLowerCase().includes(query);
        return tableMatch || staffMatch || noteMatch || orderTypeMatch;
      });
    }

    return allOrders;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
      case 'completed': return 'bg-green-500/20 text-green-500 border-green-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-500 border-red-500/30';
      case 'draft': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default: return 'bg-gray-500/20 text-gray-500 border-gray-500/30';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'completed': return '✅';
      case 'cancelled': return '❌';
      case 'draft': return '📝';
      default: return '📋';
    }
  };

  const groupOrdersByTable = (ordersList) => {
    const grouped = {};
    if (Array.isArray(ordersList)) {
      ordersList.forEach(order => {
        if (!order) return;
        const table = order.tableNumber || 'No Table';
        if (!grouped[table]) {
          grouped[table] = [];
        }
        grouped[table].push(order);
      });
    }
    return Object.keys(grouped).sort((a, b) => {
      if (a === 'No Table') return 1;
      if (b === 'No Table') return -1;
      return parseInt(a) - parseInt(b);
    }).reduce((acc, key) => {
      acc[key] = grouped[key];
      return acc;
    }, {});
  };

  const toggleTableExpand = (tableNumber) => {
    setExpandedTables(prev => ({
      ...prev,
      [tableNumber]: !prev[tableNumber]
    }));
  };

  // Helper function to render order items with individual prices and tracking
  const renderOrderItemWithTracking = (item, orderId, tableNumber, showTracking = false) => {
    const price = parseFloat(item.price) || 0;
    const quantity = item.quantity || 1;
    const total = price * quantity;
    const isComplimentary = item.isComplimentary || false;
    const itemId = item.id || item.name;
    const trackingKey = `${orderId}-${itemId}`;
    const tracking = itemTracking[trackingKey] || { delivered: false, notes: [], quantityDelivered: 0 };
    const isDelivered = tracking.delivered || false;
    
    // Check if this item has new items added
    const newItemsKey = `${orderId}-${itemId}`;
    const newItemsInfo = newItemsCount[newItemsKey];
    const hasNewItems = newItemsInfo && newItemsInfo.count > 0;

    return (
      <div key={itemId} className="flex justify-between items-center text-sm py-1 group hover:bg-[#2A2A2A] rounded px-2 transition">
        <div className="flex items-center gap-3 flex-1">
          {/* Tracking checkbox */}
          {showTracking && (
            <button
              onClick={() => toggleItemTracking(orderId, itemId, tableNumber)}
              className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition ${
                isDelivered 
                  ? 'bg-green-500 border-green-500 text-white' 
                  : 'border-gray-500 hover:border-amber-500'
              }`}
              title={isDelivered ? 'Mark as undelivered' : 'Mark as delivered'}
            >
              {isDelivered && <FaCheck size={12} />}
            </button>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={isComplimentary ? 'text-gray-400' : 'text-gray-300'}>
              {item.name}
              {isComplimentary && (
                <span className="text-green-400 text-xs ml-1">(Comp)</span>
              )}
              {isDelivered && showTracking && (
                <span className="text-green-400 text-xs ml-1">✅ Delivered</span>
              )}
              <span className="text-gray-500"> ×{quantity}</span>
              <span className="text-gray-500 text-xs ml-1">
                (₹{price.toFixed(2)} each)
              </span>
              {/* Show new items added count */}
              {hasNewItems && showTracking && (
                <span className="ml-2 inline-flex items-center gap-1 bg-amber-500/20 text-amber-400 text-xs px-2 py-0.5 rounded-full animate-pulse">
                  <span className="font-bold">{newItemsInfo.count}</span> new item{newItemsInfo.count > 1 ? 's' : ''} added!
                  <span className="text-gray-400 text-[10px] ml-1">(total: {newItemsInfo.total})</span>
                </span>
              )}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`font-semibold ${isComplimentary ? 'text-green-400 line-through' : 'text-amber-500'}`}>
            ₹{total.toFixed(2)}
          </span>
          {showTracking && tracking.notes && tracking.notes.length > 0 && (
            <button
              onClick={() => {
                const notesHistory = tracking.notes.join('\n');
                alert(`📝 Delivery History for ${item.name}:\n\n${notesHistory}`);
              }}
              className="text-xs text-blue-400 hover:text-blue-300 opacity-0 group-hover:opacity-100 transition"
              title="View delivery history"
            >
              <FaHistory size={12} />
            </button>
          )}
        </div>
      </div>
    );
  };

  // Helper function to render order items (for bill/print)
  const renderOrderItem = (item, showOrderIds = false) => {
    const price = parseFloat(item.price) || 0;
    const quantity = item.quantity || 1;
    const total = price * quantity;
    const isComplimentary = item.isComplimentary || false;

    return (
      <div key={item.id || item.name} className="flex justify-between items-center text-sm py-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={isComplimentary ? 'text-gray-400' : 'text-gray-300'}>
            {item.name}
            {isComplimentary && (
              <span className="text-green-400 text-xs ml-1">(Comp)</span>
            )}
            <span className="text-gray-500"> ×{quantity}</span>
            <span className="text-gray-500 text-xs ml-1">
              (₹{price.toFixed(2)} each)
            </span>
            {showOrderIds && item.orderIds && item.orderIds.length > 1 && (
              <span className="text-xs text-blue-400 ml-1">
                (from {item.orderIds.length} orders)
              </span>
            )}
          </span>
        </div>
        <span className={`font-semibold ${isComplimentary ? 'text-green-400 line-through' : 'text-amber-500'}`}>
          ₹{total.toFixed(2)}
        </span>
      </div>
    );
  };

  // Helper function to render consolidated bill items (for printing)
  const renderConsolidatedBillItems = (items) => {
    // Group items by name to consolidate
    const consolidated = {};
    items.forEach(item => {
      const key = item.id || item.name;
      if (consolidated[key]) {
        consolidated[key].quantity += item.quantity || 1;
      } else {
        consolidated[key] = { ...item, quantity: item.quantity || 1 };
      }
    });

    return Object.values(consolidated).map((item) => {
      const price = parseFloat(item.price) || 0;
      const quantity = item.quantity || 1;
      const total = price * quantity;
      const isComplimentary = item.isComplimentary || false;

      return (
        <div key={item.id || item.name} className={`flex justify-between items-center py-1.5 border-b border-gray-300 text-sm ${isComplimentary ? 'bg-green-50' : ''}`}>
          <div className="flex items-center gap-2">
            <span className="text-black">
              {item.name} 
              <span className="text-gray-500"> ×{quantity}</span>
              <span className="text-gray-400 ml-2 text-xs">(₹{price.toFixed(2)} each)</span>
            </span>
            {isComplimentary && (
              <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                <FaGift size={10} /> Comp
              </span>
            )}
          </div>
          <span className={`font-semibold ${isComplimentary ? 'text-green-500 line-through' : 'text-amber-500'}`}>
            ₹{total.toFixed(2)}
          </span>
        </div>
      );
    });
  };

  const filteredOrders = getFilteredOrders();
  const groupedOrders = groupOrdersByTable(filteredOrders);

  // Get summary counts
  const pendingConsolidated = getConsolidatedOrders();
  const completedConsolidated = getConsolidatedCompletedOrders();
  const totalPending = Object.keys(pendingConsolidated).length;
  const totalCompleted = Object.keys(completedConsolidated).length;
  const totalCancelled = orders.filter(o => o && o.status === 'cancelled').length;
  const totalDrafts = draftOrders.length;
  const totalOrders = totalPending + totalCompleted + totalCancelled + totalDrafts;

  // Get selected orders summary
  const selectedDetails = getSelectedOrderDetails();
  const selectedCount = selectedOrders.length;
  const selectedTotal = selectedDetails.totalAmount;

  // Get delivery statistics
  const getDeliveryStats = () => {
    let totalItems = 0;
    let deliveredItems = 0;
    
    Object.values(itemTracking).forEach(tracking => {
      totalItems++;
      if (tracking.delivered) {
        deliveredItems++;
      }
    });
    
    return { totalItems, deliveredItems };
  };

  const deliveryStats = getDeliveryStats();

  // Get total new items count
  const totalNewItems = Object.values(newItemsCount).reduce((sum, n) => sum + n.count, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1C242A] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-white">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1C242A] p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <img src={logoDark} alt="Café Élan" className="h-12 md:h-14 object-contain" />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-amber-500">Orders Dashboard</h1>
                <p className="text-gray-400 text-sm">Manage and track all restaurant orders</p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              {/* Delivery Stats */}
              <div className="bg-[#2A2A2A] px-3 py-2 rounded-lg flex items-center gap-3">
                <span className="text-gray-400 text-xs">📦 Delivery Status:</span>
                <span className="text-green-400 text-sm font-semibold">
                  {deliveryStats.deliveredItems}/{deliveryStats.totalItems} delivered
                </span>
              </div>
              {/* New Items Count */}
              <div className="bg-[#2A2A2A] px-3 py-2 rounded-lg flex items-center gap-3">
                <span className="text-gray-400 text-xs">🆕 New Items:</span>
                <span className="text-amber-400 text-sm font-semibold">{totalNewItems}</span>
              </div>
              <button
                onClick={() => setShowSelectionMode(!showSelectionMode)}
                className={`px-3 py-2 rounded-lg transition flex items-center gap-2 text-sm font-semibold ${
                  showSelectionMode ? 'bg-amber-500 text-black' : 'bg-[#2A2A2A] text-white hover:bg-amber-500/20'
                }`}
              >
                <FaCheckSquare /> {showSelectionMode ? 'Exit Selection' : 'Select Orders'}
              </button>
              <button
                onClick={syncOrders}
                disabled={syncing}
                className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-500 transition flex items-center gap-2 text-sm font-semibold disabled:opacity-50"
              >
                <FaSync className={`${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync Orders'}
              </button>
              <button
                onClick={downloadCSV}
                className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-500 transition flex items-center gap-2 text-sm font-semibold"
              >
                <FaFileExcel /> Export CSV
              </button>
              <button
                onClick={() => window.location.href = '/menu/service-staff'}
                className="bg-amber-500 text-black px-3 py-2 rounded-lg hover:bg-amber-400 transition flex items-center gap-2 text-sm font-semibold"
              >
                <FaArrowLeft /> Back to Order
              </button>
            </div>
          </div>

          {/* New Items Notification Banner */}
          {Object.keys(newItemsCount).length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex items-center justify-between animate-pulse">
              <div className="flex items-center gap-3">
                <span className="text-amber-400 text-2xl">🆕</span>
                <div>
                  <p className="text-white font-semibold">New items added!</p>
                  <p className="text-gray-400 text-sm">
                    {Object.values(newItemsCount).map((info, idx) => (
                      <span key={idx}>
                        {idx > 0 && ', '}
                        <span className="text-amber-400 font-bold">{info.count}</span> {info.itemName}
                        {info.count > 1 ? 's' : ''} (Total: {info.total})
                      </span>
                    ))}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setNewItemsCount({})}
                className="text-gray-400 hover:text-white px-2 py-1 rounded transition"
              >
                ✕
              </button>
            </div>
          )}

          {/* Selection Summary Bar */}
          {showSelectionMode && selectedCount > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-4">
                <span className="text-amber-400 font-semibold">
                  <FaCheckSquare className="inline mr-2" />
                  {selectedCount} order{selectedCount > 1 ? 's' : ''} selected
                </span>
                <span className="text-white font-bold">₹{selectedTotal.toFixed(2)}</span>
                <span className="text-gray-400 text-sm">
                  {selectedDetails.itemCount} total items
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={bulkComplete}
                  className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-500 transition text-xs font-semibold flex items-center gap-1"
                >
                  <FaCheck /> Complete All
                </button>
                <button
                  onClick={bulkCancel}
                  className="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-500 transition text-xs font-semibold flex items-center gap-1"
                >
                  <FaTimes /> Cancel All
                </button>
                <button
                  onClick={bulkPrintBill}
                  className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-500 transition text-xs font-semibold flex items-center gap-1"
                >
                  <FaPrint /> Print Bill
                </button>
                <button
                  onClick={clearSelection}
                  className="bg-gray-600 text-white px-3 py-1 rounded-lg hover:bg-gray-500 transition text-xs font-semibold"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* Search and Filter Row */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by table, staff, note, or order type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#2A2A2A] border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <button
              onClick={() => setShowDrafts(!showDrafts)}
              className={`px-4 py-2.5 rounded-lg transition flex items-center gap-2 text-sm font-semibold ${
                showDrafts ? 'bg-purple-600 text-white' : 'bg-[#2A2A2A] text-white hover:bg-amber-500/20'
              }`}
            >
              <FaHistory /> Drafts {totalDrafts > 0 && `(${totalDrafts})`}
            </button>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-500 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <FaExclamationTriangle /> {error}
            </div>
          )}

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
            <div className="bg-[#2A2A2A] rounded-xl p-3 text-center border border-white/5">
              <p className="text-gray-400 text-xs">Active Tables</p>
              <p className="text-white font-bold text-xl">{totalPending}</p>
            </div>
            <div className="bg-[#2A2A2A] rounded-xl p-3 text-center border border-white/5">
              <p className="text-gray-400 text-xs">Completed Tables</p>
              <p className="text-green-500 font-bold text-xl">{totalCompleted}</p>
            </div>
            <div className="bg-[#2A2A2A] rounded-xl p-3 text-center border border-white/5">
              <p className="text-gray-400 text-xs">Cancelled</p>
              <p className="text-red-500 font-bold text-xl">{totalCancelled}</p>
            </div>
            <div className="bg-[#2A2A2A] rounded-xl p-3 text-center border border-white/5">
              <p className="text-gray-400 text-xs">Drafts</p>
              <p className="text-purple-400 font-bold text-xl">{totalDrafts}</p>
            </div>
            <div className="bg-[#2A2A2A] rounded-xl p-3 text-center border border-white/5">
              <p className="text-gray-400 text-xs">Total Orders</p>
              <p className="text-amber-500 font-bold text-xl">{totalOrders}</p>
            </div>
            <div className="bg-[#2A2A2A] rounded-xl p-3 text-center border border-white/5">
              <p className="text-gray-400 text-xs">📦 Items Delivered</p>
              <p className="text-green-400 font-bold text-xl">
                {deliveryStats.deliveredItems}/{deliveryStats.totalItems}
              </p>
            </div>
            <div className="bg-[#2A2A2A] rounded-xl p-3 text-center border border-white/5">
              <p className="text-gray-400 text-xs">🆕 New Items</p>
              <p className="text-amber-400 font-bold text-xl">{totalNewItems}</p>
            </div>
          </div>

          {/* Status Filter Tabs - Active (pending) is default and highlighted */}
          <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 no-scrollbar">
            {['pending', 'completed', 'cancelled', ...(showDrafts ? ['draft'] : [])].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition capitalize whitespace-nowrap ${
                  filterStatus === status
                    ? 'bg-amber-500 text-black'
                    : 'bg-[#2A2A2A] text-white hover:bg-amber-500/20'
                }`}
              >
                {status === 'pending' ? '⏳ Active' :
                 status === 'completed' ? '✅ Completed' :
                 status === 'cancelled' ? '❌ Cancelled' :
                 status === 'draft' ? '📝 Draft' : status}
                {status !== 'draft' && (
                  <span className="ml-2 text-xs opacity-70">
                    ({status === 'pending' ? totalPending : 
                      status === 'completed' ? totalCompleted : 
                      totalCancelled})
                  </span>
                )}
                {status === 'draft' && (
                  <span className="ml-2 text-xs opacity-70">({totalDrafts})</span>
                )}
              </button>
            ))}
            {/* All button */}
            <button
              key="all"
              onClick={() => setFilterStatus("all")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition capitalize whitespace-nowrap ${
                filterStatus === "all"
                  ? 'bg-amber-500 text-black'
                  : 'bg-[#2A2A2A] text-white hover:bg-amber-500/20'
              }`}
            >
              📋 All
              <span className="ml-2 text-xs opacity-70">({totalOrders})</span>
            </button>
          </div>
        </div>

        {/* Orders Grid */}
        {Object.keys(groupedOrders).length === 0 ? (
          <div className="text-center py-16 bg-[#2A2A2A] rounded-xl border border-white/10">
            <p className="text-6xl mb-4">📭</p>
            <p className="text-gray-400 text-lg font-semibold">No orders found</p>
            <p className="text-gray-500 text-sm mt-1">
              {searchQuery ? 'Try adjusting your search or filters' : 'Orders will appear here once placed'}
            </p>
            {!searchQuery && filterStatus === 'pending' && !showDrafts && (
              <button
                onClick={() => window.location.href = '/menu/service-staff'}
                className="mt-4 bg-amber-500 text-black px-4 py-2 rounded-lg hover:bg-amber-400 transition text-sm font-semibold"
              >
                Go to Order Taking
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedOrders).map(([tableNumber, tableOrders]) => {
              const isExpanded = expandedTables[tableNumber] !== false;
              const pendingOrders = tableOrders.filter(o => o && o.status === 'pending');
              const completedOrders = tableOrders.filter(o => o && o.status === 'completed');
              const isOccupied = hasActiveOrders(parseInt(tableNumber));
              const isCompleted = completedOrders.length > 0;
              const showTracking = showItemTracking[tableNumber] || false;
              
              // Get all order IDs for this table
              const tableOrderIds = tableOrders.map(o => o.id);
              const allSelected = tableOrderIds.every(id => selectedOrders.includes(id));

              // Check if this is a consolidated order
              const isConsolidated = tableOrders.some(o => o.isConsolidated);
              const orderCount = tableOrders.reduce((sum, o) => sum + (o.orderCount || 1), 0);

              return (
                <div key={tableNumber} className="bg-[#2A2A2A] rounded-xl border border-white/10 overflow-hidden">
                  {/* Table Header */}
                  <div 
                    className="flex flex-wrap justify-between items-center p-4 bg-[#1C242A] border-b border-white/10 cursor-pointer hover:bg-[#252525] transition"
                    onClick={() => toggleTableExpand(tableNumber)}
                  >
                    <div className="flex items-center gap-4">
                      {showSelectionMode && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (allSelected) {
                              setSelectedOrders(prev => prev.filter(id => !tableOrderIds.includes(id)));
                            } else {
                              const newIds = tableOrderIds.filter(id => !selectedOrders.includes(id));
                              setSelectedOrders(prev => [...prev, ...newIds]);
                            }
                          }}
                          className="text-amber-400 hover:text-amber-300"
                        >
                          {allSelected ? <FaCheckSquare size={18} /> : <FaRegSquare size={18} />}
                        </button>
                      )}
                      <h2 className="text-lg font-bold text-white">
                        {tableNumber === 'No Table' ? '🚫 No Table' : `Table ${tableNumber}`}
                      </h2>
                      {isOccupied && (
                        <span className="bg-red-500 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1">
                          <span className="animate-pulse">●</span> Occupied
                        </span>
                      )}
                      {isCompleted && (
                        <span className="bg-green-500 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1">
                          ✅ Completed
                        </span>
                      )}
                      <span className="text-gray-400 text-xs">
                        {pendingOrders.length} active, {completedOrders.length} completed
                      </span>
                      {isConsolidated && orderCount > 1 && (
                        <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">
                          {orderCount} orders combined
                        </span>
                      )}
                      {/* Tracking toggle button */}
                      {pendingOrders.length > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleItemTrackingVisibility(tableNumber);
                          }}
                          className={`text-xs px-2 py-1 rounded transition ${
                            showTracking
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          {showTracking ? '📦 Hide Tracking' : '📦 Track Items'}
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      {pendingOrders.length > 0 && (
                        <div className="flex items-center gap-2 bg-amber-500/10 px-3 py-1 rounded-lg">
                          <FaCalculator className="text-amber-500 text-sm" />
                          <span className="text-amber-500 font-bold">
                            ₹{pendingOrders.reduce((sum, o) => sum + calculateBillableTotal(o.items), 0).toFixed(2)}
                          </span>
                        </div>
                      )}
                      <span className="text-gray-400 text-sm">
                        {isExpanded ? '▲' : '▼'}
                      </span>
                    </div>
                  </div>

                  {/* Table Orders - Consolidated View */}
                  {isExpanded && (
                    <div className="p-4 space-y-4">
                      {tableOrders.map((order, idx) => {
                        const isEditing = editingOrderId === order.id;
                        const total = calculateOrderTotal(order.items);
                        const billableTotal = calculateBillableTotal(order.items);
                        const complimentaryTotal = calculateComplimentaryTotal(order.items);
                        const isSelected = selectedOrders.includes(order.id);
                        const isConsolidatedOrder = order.isConsolidated;
                        const orderCount = order.orderCount || 1;
                        const isCompletedOrder = order.status === 'completed';

                        // Get order history
                        const hasHistory = orderCount > 1 || (order.originalOrders && order.originalOrders.length > 1);
                        const showHistory = showOrderHistory[tableNumber] || false;

                        return (
                          <div
                            key={order.id || idx}
                            className={`bg-[#1C242A] rounded-lg p-4 border ${
                              isSelected ? 'border-amber-500 border-2' :
                              order.status === 'pending' ? 'border-yellow-500/30' :
                              order.status === 'completed' ? 'border-green-500/30' :
                              order.status === 'cancelled' ? 'border-red-500/30' :
                              order.status === 'draft' ? 'border-purple-500/30 border-dashed' :
                              'border-white/10'
                            } ${isEditing ? 'border-2 border-amber-500' : ''}`}
                          >
                            {/* Order Header */}
                            <div className="flex flex-wrap justify-between items-start mb-3 gap-2">
                              <div className="flex items-center gap-3 flex-wrap">
                                {showSelectionMode && order.status === 'pending' && (
                                  <button
                                    onClick={() => toggleOrderSelection(order.id)}
                                    className="text-amber-400 hover:text-amber-300"
                                  >
                                    {isSelected ? <FaCheckSquare size={18} /> : <FaRegSquare size={18} />}
                                  </button>
                                )}
                                <span className="text-white font-semibold text-base">
                                  {isConsolidatedOrder ? 'Consolidated Order' : `Order #${idx + 1}`}
                                </span>
                                {isConsolidatedOrder && orderCount > 1 && (
                                  <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">
                                    {orderCount} orders combined
                                  </span>
                                )}
                                {order.orderType && order.orderType !== 'dine-in' && (
                                  <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">
                                    {order.orderType}
                                  </span>
                                )}
                                {isEditing && (
                                  <span className="text-xs bg-amber-500 text-black px-2 py-0.5 rounded-full animate-pulse">
                                    Editing...
                                  </span>
                                )}
                                <span className="text-gray-400 text-xs flex items-center gap-1">
                                  <FaUser size={10} /> {order.numberOfGuests || 1} guests
                                </span>
                                {order.staffName && (
                                  <span className="text-gray-400 text-xs flex items-center gap-1">
                                    <FaUser size={10} /> {order.staffName}
                                  </span>
                                )}
                                <span className="text-gray-400 text-xs flex items-center gap-1">
                                  <FaClock size={10} /> {formatTime(order.timestamp)}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)} border`}>
                                  {getStatusIcon(order.status)} {order.status}
                                </span>
                              </div>
                            </div>

                            {/* Order Items */}
                            {isEditing ? (
                              <div className="space-y-2 mt-2">
                                {editItems.map((item) => (
                                  <div key={item.id} className={`flex items-center justify-between bg-[#1C242A]/50 rounded-lg p-2 border ${item.isComplimentary ? 'border-green-500/30 bg-green-500/5' : 'border-white/5'}`}>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="text-white text-sm">{item.name}</span>
                                        {item.isComplimentary && (
                                          <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                                            <FaGift size={10} /> Comp
                                          </span>
                                        )}
                                        <span className="text-gray-400 text-xs">₹{parseFloat(item.price).toFixed(2)} each</span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => toggleItemComplimentary(item.id)}
                                        className={`p-1 rounded transition ${
                                          item.isComplimentary
                                            ? 'bg-green-600 text-white hover:bg-green-500'
                                            : 'bg-gray-700 text-gray-400 hover:bg-green-500/20 hover:text-green-400'
                                        }`}
                                        title="Toggle complimentary"
                                      >
                                        <FaGift size={12} />
                                      </button>
                                      <button
                                        onClick={() => updateItemQuantity(item.id, -1)}
                                        className="bg-gray-700 text-white hover:bg-red-500/20 p-1 rounded"
                                      >
                                        <FaMinus size={12} />
                                      </button>
                                      <span className="text-white min-w-[24px] text-center text-sm">
                                        {item.quantity}
                                      </span>
                                      <button
                                        onClick={() => updateItemQuantity(item.id, 1)}
                                        className="bg-gray-700 text-white hover:bg-green-500/20 p-1 rounded"
                                      >
                                        <FaPlus size={12} />
                                      </button>
                                      <button
                                        onClick={() => removeEditItem(item.id)}
                                        className="bg-gray-700 text-red-400 hover:text-red-300 p-1 rounded"
                                      >
                                        <FaTrash size={12} />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                                {editItems.length === 0 && (
                                  <div className="text-center text-gray-400 py-4 text-sm">
                                    No items in this order
                                  </div>
                                )}

                                <div className="space-y-1 mt-2 pt-2 border-t border-white/5">
                                  <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-400">Subtotal</span>
                                    <span className="text-amber-500 font-bold">
                                      ₹{calculateOrderTotal(editItems).toFixed(2)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center text-sm">
                                    <span className="text-green-400">Complimentary</span>
                                    <span className="text-green-400 font-bold">
                                      -₹{calculateComplimentaryTotal(editItems).toFixed(2)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center text-base pt-1 border-t border-white/5">
                                    <span className="text-white font-semibold">Billable Total</span>
                                    <span className="text-amber-500 font-bold text-lg">
                                      ₹{calculateBillableTotal(editItems).toFixed(2)}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex justify-end gap-2 mt-2">
                                  <button
                                    onClick={() => saveEditedOrder(order.id)}
                                    className="bg-green-600 text-white px-4 py-1.5 rounded-lg hover:bg-green-500 transition text-sm flex items-center gap-1"
                                  >
                                    <FaSave /> Save
                                  </button>
                                  <button
                                    onClick={cancelEditing}
                                    className="bg-gray-600 text-white px-4 py-1.5 rounded-lg hover:bg-gray-500 transition text-sm"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="space-y-1.5 mt-2">
                                  {order.items && order.items.map((item) => {
                                    if (showTracking) {
                                      return renderOrderItemWithTracking(item, order.id, tableNumber, true);
                                    } else {
                                      return renderOrderItem(item, true);
                                    }
                                  })}
                                </div>

                                <div className="space-y-0.5 mt-3 pt-2 border-t border-white/5">
                                  <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-400">Subtotal</span>
                                    <span className="text-amber-500 font-bold">
                                      ₹{total.toFixed(2)}
                                    </span>
                                  </div>
                                  {complimentaryTotal > 0 && (
                                    <div className="flex justify-between items-center text-sm">
                                      <span className="text-green-400">Complimentary</span>
                                      <span className="text-green-400 font-bold">
                                        -₹{complimentaryTotal.toFixed(2)}
                                      </span>
                                    </div>
                                  )}
                                  <div className="flex justify-between items-center text-base pt-1 border-t border-white/5">
                                    <span className="text-white font-semibold">Billable Total</span>
                                    <span className="text-amber-500 font-bold text-lg">
                                      ₹{billableTotal.toFixed(2)}
                                    </span>
                                  </div>
                                </div>

                                {/* Show order history if available */}
                                {hasHistory && (
                                  <div className="mt-2">
                                    <button
                                      onClick={() => toggleOrderHistory(tableNumber)}
                                      className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                    >
                                      {showHistory ? '▼' : '▶'} {showHistory ? 'Hide' : 'Show'} Order History ({orderCount} orders)
                                    </button>
                                    {showHistory && order.originalOrders && (
                                      <div className="mt-2 space-y-2 bg-[#1C242A]/50 rounded-lg p-2 border border-white/5">
                                        {order.originalOrders.map((orig, idx) => (
                                          <div key={idx} className="flex justify-between items-center text-xs text-gray-400 border-b border-white/5 pb-1 last:border-0">
                                            <div className="flex items-center gap-2">
                                              <span className="text-amber-400">Order #{idx + 1}</span>
                                              <span>{formatTime(orig.timestamp)}</span>
                                              <span>{orig.items ? orig.items.length : 0} items</span>
                                              <span>₹{calculateBillableTotal(orig.items).toFixed(2)}</span>
                                            </div>
                                            {/* Individual order complete button */}
                                            {orig.status === 'pending' && (
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  completeOriginalOrder(orig.id, tableNumber);
                                                }}
                                                className="bg-green-600 text-white px-2 py-0.5 rounded text-xs hover:bg-green-500 transition flex items-center gap-1"
                                              >
                                                <FaCheck size={10} /> Complete
                                              </button>
                                            )}
                                            {orig.status === 'completed' && (
                                              <span className="text-green-500 text-xs">✅ Done</span>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </>
                            )}

                            {/* Order Actions */}
                            {!isEditing && (
                              <div className="flex flex-wrap justify-end gap-2 mt-3 pt-2 border-t border-white/5">
                                {order.status === 'pending' && (
                                  <>
                                    <button
                                      onClick={() => openBillModal(order, "single", false)}
                                      className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-500 transition text-xs flex items-center gap-1"
                                    >
                                      <FaPrint size={12} /> Bill
                                    </button>
                                    <button
                                      onClick={() => startEditing(order)}
                                      className="bg-amber-600 text-white px-3 py-1 rounded-lg hover:bg-amber-500 transition text-xs flex items-center gap-1"
                                    >
                                      <FaEdit size={12} /> Edit
                                    </button>
                                    {/* Individual order complete button for consolidated order */}
                                    {isConsolidatedOrder && order.originalOrders && order.originalOrders.length > 1 ? (
                                      <>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            // Show option to complete individual orders
                                            const orderOptions = order.originalOrders.map((o, idx) => 
                                              `Order #${idx + 1} (${formatTime(o.timestamp)}) - ₹${calculateBillableTotal(o.items).toFixed(2)}`
                                            ).join('\n');
                                            const choice = window.confirm(
                                              `Which order would you like to complete?\n\n` +
                                              `0 - Complete ALL orders for this table\n` +
                                              orderOptions.map((opt, i) => `${i + 1} - ${opt}`).join('\n')
                                            );
                                            
                                            if (choice === true) {
                                              // User clicked OK - show selection prompt
                                              const selection = window.prompt(
                                                `Enter the number of the order to complete:\n` +
                                                `0 - Complete ALL orders\n` +
                                                orderOptions.map((opt, i) => `${i + 1} - ${opt}`).join('\n')
                                              );
                                              
                                              if (selection !== null) {
                                                const selectedIdx = parseInt(selection);
                                                if (selectedIdx === 0) {
                                                  // Complete all
                                                  markIndividualOrderComplete(order.id);
                                                } else if (selectedIdx > 0 && selectedIdx <= order.originalOrders.length) {
                                                  // Complete specific order
                                                  const originalOrder = order.originalOrders[selectedIdx - 1];
                                                  if (originalOrder) {
                                                    completeOriginalOrder(originalOrder.id, tableNumber);
                                                  }
                                                } else {
                                                  alert('Invalid selection. Please try again.');
                                                }
                                              }
                                            }
                                          }}
                                          className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-500 transition text-xs flex items-center gap-1"
                                        >
                                          <FaCheck size={12} /> Complete Order
                                        </button>
                                      </>
                                    ) : (
                                      <button
                                        onClick={() => markIndividualOrderComplete(order.id)}
                                        className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-500 transition text-xs flex items-center gap-1"
                                      >
                                        <FaCheck size={12} /> Complete
                                      </button>
                                    )}
                                    <button
                                      onClick={() => updateOrderStatus(order.id, 'cancelled')}
                                      className="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-500 transition text-xs"
                                    >
                                      ❌ Cancel
                                    </button>
                                  </>
                                )}
                                {order.status === 'completed' && (
                                  <>
                                    <button
                                      onClick={() => openBillModal(order, "full", true)}
                                      className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-500 transition text-xs flex items-center gap-1"
                                    >
                                      <FaPrint size={12} /> Print Bill
                                    </button>
                                    <button
                                      onClick={() => deleteOrder(order.id)}
                                      className="bg-gray-600 text-white px-3 py-1 rounded-lg hover:bg-gray-500 transition text-xs"
                                    >
                                      <FaTrash size={12} />
                                    </button>
                                  </>
                                )}
                                {order.status === 'draft' && (
                                  <>
                                    <button
                                      onClick={() => continueDraftOrder(order)}
                                      className="bg-purple-600 text-white px-3 py-1 rounded-lg hover:bg-purple-500 transition text-xs font-semibold"
                                    >
                                      Continue
                                    </button>
                                    <button
                                      onClick={() => deleteDraftOrder(order.id)}
                                      className="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-500 transition text-xs"
                                    >
                                      <FaTrash size={12} />
                                    </button>
                                  </>
                                )}
                                {order.status === 'cancelled' && (
                                  <>
                                    <button
                                      onClick={() => openBillModal(order, "single", false)}
                                      className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-500 transition text-xs flex items-center gap-1"
                                    >
                                      <FaPrint size={12} /> Bill
                                    </button>
                                    <button
                                      onClick={() => deleteOrder(order.id)}
                                      className="bg-gray-600 text-white px-3 py-1 rounded-lg hover:bg-gray-500 transition text-xs"
                                    >
                                      <FaTrash size={12} />
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      
                      {/* Full Bill Button for the table - for pending orders */}
                      {pendingOrders.length > 0 && (
                        <div className="flex justify-end mt-2">
                          <button
                            onClick={() => openBillModal(pendingOrders[0], "full", false)}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-500 transition text-sm flex items-center gap-2 font-semibold"
                          >
                            <FaPrintIcon /> Print Full Bill ({pendingOrders.reduce((sum, o) => sum + (o.orderCount || 1), 0)} orders)
                          </button>
                        </div>
                      )}
                      
                      {/* Full Bill Button for the table - for completed orders */}
                      {completedOrders.length > 0 && (
                        <div className="flex justify-end mt-2">
                          <button
                            onClick={() => openBillModal(completedOrders[0], "full", true)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-500 transition text-sm flex items-center gap-2 font-semibold"
                          >
                            <FaPrintIcon /> Print Completed Bill ({completedOrders.reduce((sum, o) => sum + (o.orderCount || 1), 0)} orders)
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Bill Modal - Consolidated Print View */}
        {showBillModal && billOrder && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-10">
                <h2 className="text-xl font-bold text-amber-500">
                  {billOrder.isCompleted ? '📋 Completed Bill' :
                   billType === "full" ? `Full Bill - ${billOrder.tableNumber === 'Multiple' ? 'Selected Orders' : 'Table ' + billOrder.tableNumber} (${billOrder.orderCount || 0} orders)` : "Bill Preview"}
                </h2>
                <button onClick={closeBillModal} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
              </div>

              <div className="p-6 bill-content" id="bill-content">
                <div className="text-center border-b-2 border-black pb-4 mb-4">
                  <img src={logoDark} alt="Café Élan" className="h-16 mx-auto mb-2 object-contain" />
                  <h2 className="text-xl font-bold text-amber-500">Café Élan</h2>
                  <p className="text-gray-600 text-sm">Made for the moments that matter.</p>
                  <p className="text-gray-500 text-xs mt-1">For Home Delivery Call: 81004 87277</p>
                </div>

                <div className="mb-4 space-y-1 text-sm">
                  <div className="flex justify-between border-b border-gray-300 pb-1">
                    <span className="text-gray-600">Table:</span>
                    <span className="text-black font-semibold">{billOrder.tableNumber || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-300 pb-1">
                    <span className="text-gray-600">Staff:</span>
                    <span className="text-black">{billOrder.staffName || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-300 pb-1">
                    <span className="text-gray-600">Date:</span>
                    <span className="text-black">{formatDate(billOrder.timestamp)}</span>
                  </div>
                  {billOrder.orderCount > 1 && (
                    <div className="flex justify-between border-b border-gray-300 pb-1">
                      <span className="text-gray-600">Total Orders:</span>
                      <span className="text-black font-semibold">{billOrder.orderCount} orders</span>
                    </div>
                  )}
                  {billOrder.isConsolidated && (
                    <div className="flex justify-between border-b border-gray-300 pb-1">
                      <span className="text-gray-600">Status:</span>
                      <span className="text-blue-500 font-semibold">Consolidated</span>
                    </div>
                  )}
                  {billOrder.isCompleted && (
                    <div className="flex justify-between border-b-2 border-black pb-1">
                      <span className="text-gray-600">Bill Type:</span>
                      <span className="text-green-600 font-semibold">✅ Completed Bill</span>
                    </div>
                  )}
                  {!billOrder.isCompleted && (
                    <div className="flex justify-between border-b-2 border-black pb-1">
                      <span className="text-gray-600">Bill Type:</span>
                      <span className="text-amber-500 font-semibold">
                        {billType === "full" ? "📋 Full Bill" : "📄 Single Bill"}
                      </span>
                    </div>
                  )}
                </div>

                <div className="border-t-2 border-black pt-3 mb-3">
                  <h3 className="text-sm font-semibold text-amber-500 mb-2">
                    {billOrder.isCompleted ? '✅ Completed Order Items' :
                     billType === "full" ? `All Items (Consolidated from ${billOrder.orderCount || 0} Orders)` : "Order Items"}
                  </h3>
                  
                  {/* Show consolidated items for both full and single bills */}
                  {billOrder.items && billOrder.items.length > 0 && (
                    <div className="space-y-1">
                      {renderConsolidatedBillItems(billOrder.items)}
                    </div>
                  )}

                  {/* Show order breakdown for full bill if needed */}
                  {billType === "full" && billOrder.isBulkPrint && billOrder.tableOrders && billOrder.tableOrders.length > 1 && (
                    <div className="mt-4 pt-3 border-t border-gray-200">
                      <details className="text-xs">
                        <summary className="text-gray-600 cursor-pointer font-semibold mb-2">
                          View Order Breakdown ({billOrder.tableOrders.length} orders)
                        </summary>
                        <div className="space-y-3 mt-2">
                          {billOrder.tableOrders.map((order, orderIdx) => (
                            <div key={order.id || orderIdx} className="border border-gray-200 rounded-lg p-2 bg-gray-50">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-xs font-semibold text-gray-700">Order #{orderIdx + 1}</span>
                                <span className="text-xs text-gray-500">{formatDate(order.timestamp)}</span>
                              </div>
                              {order.items && order.items.map((item) => {
                                const price = parseFloat(item.price) || 0;
                                const quantity = item.quantity || 1;
                                return (
                                  <div key={item.id || item.name} className="flex justify-between items-center py-0.5 text-xs border-b border-gray-100 last:border-0">
                                    <span className="text-gray-600">{item.name} ×{quantity}</span>
                                    <span className="text-amber-500 font-semibold">₹{(price * quantity).toFixed(2)}</span>
                                  </div>
                                );
                              })}
                              <div className="flex justify-end text-xs font-semibold text-gray-600 mt-1 pt-1 border-t border-gray-200">
                                Subtotal: ₹{calculateOrderTotal(order.items).toFixed(2)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>
                  )}
                </div>

                <div className="border-t-2 border-black pt-3">
                  <div className="flex justify-between text-sm border-b border-gray-300 pb-1">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="text-black">₹{billOrder.subtotal.toFixed(2)}</span>
                  </div>

                  {billOrder.complimentaryTotal > 0 && (
                    <div className="flex justify-between text-sm border-b border-gray-300 pb-1">
                      <span className="text-green-600">Complimentary:</span>
                      <span className="text-green-600">-₹{billOrder.complimentaryTotal.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm border-b border-gray-300 pb-1">
                    <span className="text-gray-600">Billable Amount:</span>
                    <span className="text-black font-semibold">₹{billOrder.total.toFixed(2)}</span>
                  </div>

                  <div className="mt-3 border-t border-gray-300 pt-3">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <button
                        onClick={() => setShowDiscountInput(!showDiscountInput)}
                        className="text-xs bg-amber-500/20 text-amber-600 px-3 py-1 rounded-lg hover:bg-amber-500/30 transition"
                      >
                        {showDiscountInput ? 'Hide Discount' : 'Add Discount'}
                      </button>
                      <button
                        onClick={() => setShowComplimentary(!showComplimentary)}
                        className={`text-xs px-3 py-1 rounded-lg transition flex items-center gap-1 ${
                          showComplimentary
                            ? 'bg-green-600 text-white'
                            : 'bg-green-500/20 text-green-600 hover:bg-green-500/30'
                        }`}
                      >
                        <FaGift /> {showComplimentary ? 'Hide Complimentary' : 'Mark Complimentary'}
                      </button>
                    </div>

                    {showComplimentary && (
                      <div className="bg-gray-100 rounded-lg p-3 border border-gray-300 mb-3">
                        <p className="text-xs text-gray-600 mb-2">Click on an item to mark as complimentary:</p>
                        <div className="space-y-1">
                          {billOrder.items.map((item, idx) => {
                            const isComp = item.isComplimentary || false;
                            return (
                              <button
                                key={idx}
                                onClick={() => toggleBillItemComplimentary(item.id)}
                                className={`w-full flex justify-between items-center p-2 rounded text-xs transition ${
                                  isComp
                                    ? 'bg-green-100 border border-green-300'
                                    : 'bg-white hover:bg-gray-50 border border-gray-200'
                                }`}
                              >
                                <span className="text-gray-800">{item.name}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-amber-500">₹{item.price}</span>
                                  {isComp ? (
                                    <span className="text-green-600 text-xs">✅ Comp</span>
                                  ) : (
                                    <span className="text-gray-400 text-xs">Click to mark</span>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {showDiscountInput && (
                      <div className="bg-gray-100 rounded-lg p-3 space-y-3 border border-gray-300">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setDiscountType("percentage")}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                              discountType === "percentage"
                                ? 'bg-amber-500 text-black'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            <FaPercent className="inline mr-1" /> Percentage
                          </button>
                          <button
                            onClick={() => setDiscountType("amount")}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                              discountType === "amount"
                                ? 'bg-amber-500 text-black'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            <FaRupeeSign className="inline mr-1" /> Amount
                          </button>
                        </div>

                        <div className="flex gap-2">
                          <input
                            type="number"
                            placeholder={discountType === "percentage" ? "Enter % (e.g., 10)" : "Enter amount (e.g., 50)"}
                            value={discountValue}
                            onChange={(e) => setDiscountValue(e.target.value)}
                            className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-amber-500"
                            min="0"
                          />
                          <input
                            type="text"
                            placeholder="Reason (optional)"
                            value={discountReason}
                            onChange={(e) => setDiscountReason(e.target.value)}
                            className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-800 text-sm focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>
                    )}

                    {discountValue && (
                      <div className="mt-2 flex justify-between text-sm border-b border-gray-300 pb-1">
                        <span className="text-green-600">
                          Discount ({discountType === "percentage" ? `${discountValue}%` : `₹${discountValue}`})
                          {discountReason && <span className="text-gray-500 text-xs ml-1">({discountReason})</span>}
                        </span>
                        <span className="text-green-600">
                          -₹{calculateDiscountAmount(
                            billOrder.total,
                            discountType,
                            discountValue
                          ).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center mt-3 pt-3 border-t-2 border-black">
                    <span className="text-black font-bold text-lg">Grand Total</span>
                    <span className="text-amber-500 font-bold text-xl">
                      ₹{calculateDiscountedTotal(
                        billOrder.total,
                        discountType,
                        discountValue
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="text-center border-t-2 border-black pt-4 mt-4">
                  <p className="text-gray-600 text-xs">Thank you for dining with us!</p>
                  <p className="text-gray-600 text-xs mt-1">Visit us again at Café Élan</p>
                  <p className="text-gray-500 text-[10px] mt-2">Bill generated on {new Date().toLocaleString()}</p>
                </div>
              </div>

              <div className="flex gap-2 p-4 border-t sticky bottom-0 bg-white">
                <button
                  onClick={printBill}
                  className="flex-1 bg-amber-500 text-black px-4 py-2 rounded-lg font-semibold hover:bg-amber-400 transition flex items-center justify-center gap-2"
                >
                  <FaPrint /> Print Bill
                </button>
                <button
                  onClick={closeBillModal}
                  className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-500 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .bill-content, .bill-content * {
            visibility: visible !important;
          }
          .bill-content {
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
          }
          .bill-content img {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .bill-content * {
            color: black !important;
          }
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default OrdersView;