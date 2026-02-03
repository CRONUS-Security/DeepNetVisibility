/**
 * Network utility functions for IP/CIDR parsing, matching, and hierarchy building
 */

/**
 * Parse an IP address string into a 32-bit integer
 * @param {string} ip - IP address (e.g., "192.168.1.1")
 * @returns {number} - 32-bit integer representation
 */
export function ipToInt(ip) {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return null;
  }
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

/**
 * Convert a 32-bit integer back to IP address string
 * @param {number} int - 32-bit integer
 * @returns {string} - IP address string
 */
export function intToIp(int) {
  return [
    (int >>> 24) & 255,
    (int >>> 16) & 255,
    (int >>> 8) & 255,
    int & 255,
  ].join('.');
}

/**
 * Parse a CIDR string into network address and prefix length
 * @param {string} cidr - CIDR notation (e.g., "192.168.0.0/24")
 * @returns {{ network: number, prefix: number, mask: number } | null}
 */
export function parseCIDR(cidr) {
  const match = cidr.match(/^(\d+\.\d+\.\d+\.\d+)\/(\d+)$/);
  if (!match) return null;

  const ip = match[1];
  const prefix = parseInt(match[2], 10);

  if (prefix < 0 || prefix > 32) return null;

  const ipInt = ipToInt(ip);
  if (ipInt === null) return null;

  const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
  const network = (ipInt & mask) >>> 0;

  return { network, prefix, mask };
}

/**
 * Check if an IP address is within a CIDR range
 * @param {string} ip - IP address
 * @param {string} cidr - CIDR notation
 * @returns {boolean}
 */
export function isIPInCIDR(ip, cidr) {
  const ipInt = ipToInt(ip);
  const cidrParsed = parseCIDR(cidr);

  if (ipInt === null || cidrParsed === null) return false;

  return ((ipInt & cidrParsed.mask) >>> 0) === cidrParsed.network;
}

/**
 * Check if one CIDR is contained within another (child is more specific)
 * @param {string} child - More specific CIDR
 * @param {string} parent - Less specific CIDR
 * @returns {boolean}
 */
export function isCIDRContainedIn(child, parent) {
  const childParsed = parseCIDR(child);
  const parentParsed = parseCIDR(parent);

  if (!childParsed || !parentParsed) return false;

  // Child must have a larger prefix (more specific)
  if (childParsed.prefix <= parentParsed.prefix) return false;

  // Child's network must be within parent's range
  return ((childParsed.network & parentParsed.mask) >>> 0) === parentParsed.network;
}

/**
 * Extract IP address from a string that might contain IP or CIDR
 * @param {string} value - IP or CIDR string
 * @returns {string | null}
 */
export function extractIP(value) {
  if (!value) return null;
  // If it's a CIDR, extract just the IP part
  const cidrMatch = value.match(/^(\d+\.\d+\.\d+\.\d+)\/\d+$/);
  if (cidrMatch) return cidrMatch[1];
  // Otherwise check if it's a valid IP
  const ipMatch = value.match(/^(\d+\.\d+\.\d+\.\d+)$/);
  if (ipMatch && ipToInt(ipMatch[1]) !== null) return ipMatch[1];
  return null;
}

/**
 * Check if a string is a valid CIDR notation
 * @param {string} value
 * @returns {boolean}
 */
export function isCIDR(value) {
  return parseCIDR(value) !== null;
}

/**
 * Check if a string is a valid IP address
 * @param {string} value
 * @returns {boolean}
 */
export function isValidIP(value) {
  return ipToInt(value) !== null;
}

/**
 * Parse IP list (supports comma/space/newline separated)
 * @param {string | string[]} ipInput - Single IP, array, or delimited string
 * @returns {string[]} - Array of valid IP addresses
 */
export function parseIPList(ipInput) {
  if (!ipInput) return [];
  if (Array.isArray(ipInput)) {
    return ipInput.filter(isValidIP);
  }
  // Split by comma, space, newline, or semicolon
  return ipInput
    .split(/[,;\s\n]+/)
    .map((s) => s.trim())
    .filter((s) => s && isValidIP(s));
}

/**
 * Get all IPs from a node (handles both single IP and multiple IPs)
 * @param {object} node - Node object with data.ip or data.ips
 * @returns {string[]} - Array of IP addresses
 */
export function getNodeIPs(node) {
  const ips = [];
  if (node?.data?.ip) {
    const parsed = parseIPList(node.data.ip);
    ips.push(...parsed);
  }
  if (node?.data?.ips && Array.isArray(node.data.ips)) {
    ips.push(...node.data.ips.filter(isValidIP));
  }
  return [...new Set(ips)]; // Remove duplicates
}

/**
 * Get CIDR from a node (for CIDR-type nodes)
 * @param {object} node - Node object
 * @returns {string | null} - CIDR notation or null
 */
export function getNodeCIDR(node) {
  // Check data.ip first
  if (node?.data?.ip && isCIDR(node.data.ip)) {
    return node.data.ip;
  }
  // Check label for CIDR format
  if (node?.data?.label && isCIDR(node.data.label)) {
    return node.data.label;
  }
  return null;
}

/**
 * Find the most specific (smallest) CIDR that contains the given IP
 * @param {string} ip - IP address to match
 * @param {object[]} cidrNodes - Array of CIDR nodes
 * @returns {object | null} - The best matching CIDR node
 */
export function findBestMatchingCIDR(ip, cidrNodes) {
  let bestMatch = null;
  let bestPrefix = -1;

  for (const node of cidrNodes) {
    const cidr = getNodeCIDR(node);
    if (!cidr) continue;

    if (isIPInCIDR(ip, cidr)) {
      const parsed = parseCIDR(cidr);
      if (parsed && parsed.prefix > bestPrefix) {
        bestPrefix = parsed.prefix;
        bestMatch = node;
      }
    }
  }

  return bestMatch;
}

/**
 * Find the most specific parent CIDR for a given CIDR
 * @param {string} childCIDR - Child CIDR to find parent for
 * @param {object[]} cidrNodes - Array of CIDR nodes
 * @param {string} excludeId - Node ID to exclude (the child itself)
 * @returns {object | null} - The parent CIDR node
 */
export function findParentCIDR(childCIDR, cidrNodes, excludeId) {
  let bestMatch = null;
  let bestPrefix = -1;

  for (const node of cidrNodes) {
    if (node.id === excludeId) continue;

    const parentCIDR = getNodeCIDR(node);
    if (!parentCIDR) continue;

    if (isCIDRContainedIn(childCIDR, parentCIDR)) {
      const parsed = parseCIDR(parentCIDR);
      if (parsed && parsed.prefix > bestPrefix) {
        bestPrefix = parsed.prefix;
        bestMatch = node;
      }
    }
  }

  return bestMatch;
}

/**
 * Build a hierarchy tree from nodes based on IP/CIDR containment
 * Returns edges that represent the containment relationship
 *
 * Hierarchy: IP -> most specific CIDR -> larger CIDR -> ... -> Internet/root
 *
 * @param {object[]} nodes - All nodes
 * @returns {{ edges: object[], hierarchy: Map }} - Generated edges and hierarchy map
 */
export function buildCIDRHierarchy(nodes) {
  const cidrNodes = nodes.filter((n) => n.type === 'cidr');
  const nonCidrNodes = nodes.filter((n) => n.type !== 'cidr');

  const edges = [];
  const hierarchy = new Map(); // nodeId -> parentId

  // 1. Build CIDR-to-CIDR hierarchy (smaller to larger)
  for (const node of cidrNodes) {
    const cidr = getNodeCIDR(node);
    if (!cidr) continue;

    const parent = findParentCIDR(cidr, cidrNodes, node.id);
    if (parent) {
      hierarchy.set(node.id, parent.id);
      edges.push({
        id: `auto-cidr-${node.id}-${parent.id}`,
        source: parent.id,
        target: node.id,
        data: {
          label: 'contains',
          type: 'contains',
          auto: true,
        },
      });
    }
  }

  // 2. Build IP-to-CIDR hierarchy (each IP connects to its most specific CIDR)
  for (const node of nonCidrNodes) {
    const ips = getNodeIPs(node);
    if (ips.length === 0) continue;

    // Use the first IP to find the best CIDR match
    // (In most cases, all IPs of a server should be in the same subnet)
    const primaryIP = ips[0];
    const bestCIDR = findBestMatchingCIDR(primaryIP, cidrNodes);

    if (bestCIDR) {
      hierarchy.set(node.id, bestCIDR.id);
      edges.push({
        id: `auto-ip-${node.id}-${bestCIDR.id}`,
        source: bestCIDR.id,
        target: node.id,
        data: {
          label: 'contains',
          type: 'contains',
          auto: true,
        },
      });
    }
  }

  return { edges, hierarchy };
}

/**
 * Auto-generate edges based on CIDR hierarchy
 * Preserves existing non-auto edges
 *
 * @param {object[]} nodes - All nodes
 * @param {object[]} existingEdges - Current edges
 * @param {object} options - Options for edge generation
 * @returns {object[]} - Combined edges (manual + auto-generated)
 */
export function generateAutoEdges(nodes, existingEdges = [], options = {}) {
  const { replaceAutoEdges = true, keepManualEdges = true } = options;

  // Build hierarchy
  const { edges: autoEdges } = buildCIDRHierarchy(nodes);

  // Filter existing edges
  let baseEdges = existingEdges;
  if (replaceAutoEdges) {
    baseEdges = existingEdges.filter((e) => !e.data?.auto);
  }
  if (!keepManualEdges) {
    baseEdges = [];
  }

  // Merge edges, avoiding duplicates
  const edgeSet = new Set(baseEdges.map((e) => `${e.source}-${e.target}`));
  const mergedEdges = [...baseEdges];

  for (const edge of autoEdges) {
    const key = `${edge.source}-${edge.target}`;
    const reverseKey = `${edge.target}-${edge.source}`;
    if (!edgeSet.has(key) && !edgeSet.has(reverseKey)) {
      mergedEdges.push(edge);
      edgeSet.add(key);
    }
  }

  return mergedEdges;
}

/**
 * Calculate network statistics
 * @param {object[]} nodes
 * @returns {object}
 */
export function getNetworkStats(nodes) {
  const cidrNodes = nodes.filter((n) => n.type === 'cidr');
  const serverNodes = nodes.filter((n) => n.type === 'server');
  const pcNodes = nodes.filter((n) => n.type === 'pc');
  const deviceNodes = nodes.filter((n) => n.type === 'device');

  const totalIPs = nodes.reduce((count, node) => {
    return count + getNodeIPs(node).length;
  }, 0);

  return {
    totalNodes: nodes.length,
    cidrCount: cidrNodes.length,
    serverCount: serverNodes.length,
    pcCount: pcNodes.length,
    deviceCount: deviceNodes.length,
    totalIPs,
  };
}

/**
 * Validate node IPs and return validation results
 * @param {object} node
 * @returns {{ valid: boolean, ips: string[], errors: string[] }}
 */
export function validateNodeIPs(node) {
  const errors = [];
  const validIPs = [];

  const ips = getNodeIPs(node);
  const ipInput = node?.data?.ip || '';

  // Check for invalid IPs in input
  if (ipInput) {
    const inputParts = ipInput.split(/[,;\s\n]+/).filter((s) => s.trim());
    for (const part of inputParts) {
      const trimmed = part.trim();
      if (trimmed && !isValidIP(trimmed)) {
        errors.push(`Invalid IP: ${trimmed}`);
      } else if (trimmed) {
        validIPs.push(trimmed);
      }
    }
  }

  return {
    valid: errors.length === 0,
    ips: validIPs,
    errors,
  };
}
