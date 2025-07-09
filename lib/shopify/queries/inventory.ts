/**
 * Shopify GraphQL Queries for Inventory Management
 */

export const INVENTORY_LEVELS_QUERY = `
  query InventoryLevels($variantId: ID!) {
    productVariant(id: $variantId) {
      id
      inventoryItem {
        id
        tracked
        inventoryLevels(first: 10) {
          edges {
            node {
              id
              available
              location {
                id
                name
              }
              quantities(names: ["on_hand", "committed", "incoming"]) {
                name
                quantity
              }
            }
          }
        }
      }
    }
  }
`;

export const INVENTORY_TRACKING_QUERY = `
  query InventoryTracking($first: Int!) {
    products(first: $first) {
      edges {
        node {
          id
          title
          handle
          variants(first: 10) {
            edges {
              node {
                id
                title
                inventoryItem {
                  id
                  tracked
                  inventoryLevels(first: 5) {
                    edges {
                      node {
                        id
                        available
                        location {
                          id
                          name
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

export const INVENTORY_ADJUSTMENT_MUTATION = `
  mutation InventoryAdjustQuantities($input: InventoryAdjustQuantitiesInput!) {
    inventoryAdjustQuantities(input: $input) {
      inventoryAdjustmentGroup {
        id
        createdAt
        reason
        referenceDocumentUri
        changes {
          name
          delta
          quantityAfterChange
          item {
            id
            sku
            tracked
          }
          location {
            id
            name
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const INVENTORY_BULK_ADJUST_MUTATION = `
  mutation InventoryBulkAdjustQuantityAtLocation($inventoryItemAdjustments: [InventoryAdjustItemInput!]!, $locationId: ID!) {
    inventoryBulkAdjustQuantityAtLocation(
      inventoryItemAdjustments: $inventoryItemAdjustments
      locationId: $locationId
    ) {
      inventoryLevels {
        id
        available
        item {
          id
          sku
        }
        location {
          id
          name
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const INVENTORY_ITEM_QUERY = `
  query InventoryItem($id: ID!) {
    inventoryItem(id: $id) {
      id
      sku
      tracked
      requiresShipping
      countryCodeOfOrigin
      provinceCodeOfOrigin
      harmonizedSystemCode
      countryHarmonizedSystemCodes(first: 10) {
        edges {
          node {
            countryCode
            harmonizedSystemCode
          }
        }
      }
      inventoryLevels(first: 10) {
        edges {
          node {
            id
            available
            location {
              id
              name
              address {
                country
                province
                city
              }
            }
          }
        }
      }
    }
  }
`;

export const LOCATIONS_QUERY = `
  query Locations($first: Int!) {
    locations(first: $first) {
      edges {
        node {
          id
          name
          address {
            address1
            address2
            city
            province
            country
            zip
          }
          fulfillmentService {
            id
            serviceName
            handle
          }
        }
      }
    }
  }
`;

export const INVENTORY_HISTORY_QUERY = `
  query InventoryHistory($inventoryItemId: ID!, $first: Int!) {
    inventoryItem(id: $inventoryItemId) {
      id
      sku
      inventoryHistoryUrl
      inventoryLevels(first: 1) {
        edges {
          node {
            id
            location {
              id
              name
            }
            quantities(names: ["on_hand", "available", "committed", "incoming", "reserved"]) {
              name
              quantity
            }
          }
        }
      }
    }
  }
`;

export const INVENTORY_MOVE_MUTATION = `
  mutation InventoryMoveQuantities($input: InventoryMoveQuantitiesInput!) {
    inventoryMoveQuantities(input: $input) {
      inventoryAdjustmentGroup {
        id
        createdAt
        reason
        changes {
          name
          delta
          quantityAfterChange
          item {
            id
            sku
          }
          location {
            id
            name
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const INVENTORY_ACTIVATE_MUTATION = `
  mutation InventoryActivate($inventoryItemId: ID!, $locationId: ID!, $available: Int!) {
    inventoryActivate(
      inventoryItemId: $inventoryItemId
      locationId: $locationId
      available: $available
    ) {
      inventoryLevel {
        id
        available
        location {
          id
          name
        }
        item {
          id
          sku
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const INVENTORY_DEACTIVATE_MUTATION = `
  mutation InventoryDeactivate($inventoryLevelId: ID!) {
    inventoryDeactivate(inventoryLevelId: $inventoryLevelId) {
      userErrors {
        field
        message
      }
    }
  }
`;

export const FULFILLMENT_ORDERS_QUERY = `
  query FulfillmentOrders($orderId: ID!) {
    order(id: $orderId) {
      id
      fulfillmentOrders(first: 10) {
        edges {
          node {
            id
            status
            requestStatus
            assignedLocation {
              id
              name
            }
            lineItems(first: 10) {
              edges {
                node {
                  id
                  remainingQuantity
                  totalQuantity
                  variant {
                    id
                    inventoryItem {
                      id
                      inventoryLevels(first: 1) {
                        edges {
                          node {
                            available
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

export const RESERVED_INVENTORY_QUERY = `
  query ReservedInventory($locationId: ID!, $first: Int!) {
    location(id: $locationId) {
      id
      name
      inventoryLevels(first: $first) {
        edges {
          node {
            id
            available
            quantities(names: ["reserved"]) {
              name
              quantity
            }
            item {
              id
              sku
              product {
                id
                title
                handle
              }
            }
          }
        }
      }
    }
  }
`;

export const INVENTORY_AVAILABILITY_QUERY = `
  query InventoryAvailability($productId: ID!) {
    product(id: $productId) {
      id
      title
      totalInventory
      tracksInventory
      variants(first: 100) {
        edges {
          node {
            id
            title
            inventoryQuantity
            inventoryPolicy
            inventoryItem {
              id
              tracked
              inventoryLevels(first: 10) {
                edges {
                  node {
                    id
                    available
                    location {
                      id
                      name
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

export const LOW_STOCK_QUERY = `
  query LowStock($threshold: Int!, $first: Int!) {
    products(first: $first) {
      edges {
        node {
          id
          title
          handle
          variants(first: 100) {
            edges {
              node {
                id
                title
                inventoryQuantity
                inventoryItem {
                  id
                  tracked
                  inventoryLevels(first: 10) {
                    edges {
                      node {
                        id
                        available
                        location {
                          id
                          name
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

export const PREORDER_MUTATION = `
  mutation ProductUpdate($input: ProductInput!) {
    productUpdate(input: $input) {
      product {
        id
        title
        variants(first: 1) {
          edges {
            node {
              id
              inventoryPolicy
              inventoryQuantity
            }
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;