# Test Endpoints and Verification Procedures

## Test Infrastructure Overview

The Live Shopping + WebRTC implementation includes comprehensive test infrastructure with multiple entry points for different testing scenarios. All test endpoints bypass authentication for development convenience.

## Primary Test URLs

### 1. Multi-Room Test Interface
**URL**: http://localhost:3015/test-rooms-multiples.html
**Server**: Test Server (Port 3015)
**Purpose**: Centralized testing interface for multi-window scenarios

**Features**:
- Quick launch buttons for vendor (8888) and client (8889) windows
- Room monitoring dashboard
- Cleanup utilities for test data
- Pre-configured test scenarios

**Test Buttons**:
- "Ouvrir Vendeur 8888" - Opens vendor test window
- "Ouvrir Client 8889" - Opens client test window
- "Ouvrir Client 8890" - Opens additional client window
- "Ouvrir Client 8891" - Opens additional client window

**Monitoring Functions**:
- "Actualiser les Rooms" - Refresh active room list
- "Nettoyer les Rooms" - Clean up all test rooms

### 2. Simple Live Shopping Test
**URL**: http://localhost:3016/simple-live-test?roomId=test-room&userId=8888&role=vendor
**Server**: React Dev Server (Port 3016)
**Purpose**: Direct testing of live shopping functionality

**Parameters**:
- `roomId`: Room identifier (default: test-room)
- `userId`: User identifier (8888 for vendor, 8889 for client)
- `role`: User role (vendor or viewer)

**Test Scenarios**:
- **Vendor**: http://localhost:3016/simple-live-test?roomId=test&userId=8888&role=vendor
- **Client**: http://localhost:3016/simple-live-test?roomId=test&userId=8889&role=viewer

### 3. WebRTC Test Launcher
**URL**: http://localhost:3016/webrtc-test
**Server**: React Dev Server (Port 3016)
**Purpose**: Quick launcher for WebRTC calling tests

**Usage**:
1. Enter user ID (8888 or 8889)
2. Select role (vendor or viewer)
3. Click "Démarrer le Test"
4. Redirects to enhanced live shopping with parameters

## REST API Test Endpoints

### Live Shopping Server API (Port 3008)

#### Get Active Rooms
**Endpoint**: `GET http://localhost:3008/api/live-shopping/rooms/active`
**Purpose**: List all active rooms with basic information

**Response**:
```json
{
  "rooms": [
    {
      "id": "test-room",
      "viewerCount": 3,
      "hasVendor": true,
      "createdAt": "2024-01-01T12:00:00Z"
    }
  ]
}
```

**Test Command**:
```bash
curl http://localhost:3008/api/live-shopping/rooms/active
```

#### Get Room Details
**Endpoint**: `GET http://localhost:3008/api/live-shopping/room/:roomId`
**Purpose**: Get detailed information about specific room

**Parameters**:
- `:roomId`: Room identifier

**Response**:
```json
{
  "room": {
    "id": "test-room",
    "participants": [
      {
        "userId": "8888",
        "role": "vendor",
        "name": "Vendeur 8888"
      },
      {
        "userId": "8889",
        "role": "viewer",
        "name": "Client 8889"
      }
    ],
    "currentProduct": {
      "id": "prod123",
      "name": "Test Product",
      "price": 99.99,
      "image": "/path/to/image.jpg",
      "description": "Product description"
    },
    "messageCount": 25,
    "viewerCount": 1,
    "createdAt": "2024-01-01T12:00:00Z"
  }
}
```

**Test Command**:
```bash
curl http://localhost:3008/api/live-shopping/room/test-room
```

#### Cleanup Test Data
**Endpoint**: `POST http://localhost:3008/api/live-shopping/test/cleanup`
**Purpose**: Remove all test rooms and reset server state

**Response**:
```json
{
  "message": "Test rooms cleaned up successfully",
  "cleanedRooms": 5
}
```

**Test Command**:
```bash
curl -X POST http://localhost:3008/api/live-shopping/test/cleanup
```

### Test Server API (Port 3015)

#### Get Rooms (Proxy)
**Endpoint**: `GET http://localhost:3015/api/rooms`
**Purpose**: Proxy endpoint that forwards to Live Shopping server

**Implementation**: Forwards request to `http://localhost:3008/api/live-shopping/rooms/active`

**Test Command**:
```bash
curl http://localhost:3015/api/rooms
```

## WebSocket Test Endpoints

### Live Shopping WebSocket (Port 3008)
**URL**: `ws://localhost:3008`
**Protocol**: WebSocket with JSON message format

#### Connection Test
**JavaScript Test**:
```javascript
const ws = new WebSocket('ws://localhost:3008');
ws.onopen = () => {
  console.log('Connected to Live Shopping server');
  ws.send(JSON.stringify({
    type: 'join-live-shopping',
    roomId: 'test-room',
    userId: '8888',
    role: 'vendor'
  }));
};
ws.onmessage = (event) => {
  console.log('Received:', JSON.parse(event.data));
};
```

#### Message Types for Testing

**Join Room**:
```json
{
  "type": "join-live-shopping",
  "roomId": "test-room",
  "userId": "8888",
  "role": "vendor"
}
```

**Send Chat Message**:
```json
{
  "type": "live-chat-message",
  "data": {
    "message": "Hello from test!",
    "name": "Test User"
  }
}
```

**Select Product** (Vendor only):
```json
{
  "type": "product-selected",
  "data": {
    "id": "prod123",
    "name": "Test Product",
    "price": 99.99,
    "image": "/test-image.jpg",
    "description": "Test product description"
  }
}
```

## Verification Procedures

### Pre-Test Setup
1. **Start Required Servers**:
   ```bash
   # Terminal 1: Live Shopping WebSocket Server
   node api/servers/live-shopping-chat-server.js

   # Terminal 2: Test Server
   node api/servers/test-server.js

   # Terminal 3: React Development Server
   npm run dev
   ```

2. **Verify Server Status**:
   ```bash
   # Test Live Shopping server
curl http://localhost:3008/api/live-shopping/rooms/active

   # Test Test server
curl http://localhost:3015/api/rooms

   # Test React server
curl http://localhost:3016/webrtc-test
   ```

### WebRTC Calling Verification

#### Test Scenario 1: Basic Call Flow
1. Open http://localhost:3015/test-rooms-multiples.html
2. Click "Ouvrir Vendeur 8888"
3. Click "Ouvrir Client 8889"
4. In vendor window: Click call button
5. In client window: Verify incoming call notification
6. In client window: Click answer button
7. Verify call connection established
8. Test audio/video communication
9. Either party: Click hang up
10. Verify call ended

#### Test Scenario 2: Button State Verification
**Vendor (8888) Button States**:
- **Idle**: All buttons in default state
- **Calling**: "Refuser" active, "Répondre" disabled, "Raccrocher" disabled
- **In-Call**: "Refuser" active, "Répondre" disabled, "Raccrocher" active

**Client (8889) Button States**:
- **Idle**: All buttons in default state
- **Incoming Call**: "Répondre" active, "Refuser" active, "Raccrocher" disabled
- **In-Call**: "Répondre" disabled, "Refuser" disabled, "Raccrocher" active

### Live Shopping Feature Verification

#### Product Synchronization Test
1. Open vendor window (8888)
2. Open client window (8889)
3. In vendor window: Click "Présenter" on any product
4. In client window: Verify product appears in "Produit en cours" section
5. Check product details (name, price, image, description)

#### Chat Functionality Test
1. Open multiple client windows (8889, 8890, 8891)
2. Send messages from different users
3. Verify all participants receive messages
4. Check message history persistence
5. Test with 50+ messages to verify history limit

#### Room Management Test
1. Create multiple rooms with different vendors
2. Verify room isolation (messages don't cross rooms)
3. Test room cleanup functionality
4. Verify participant count updates
5. Test vendor role restrictions

### Error Condition Testing

#### Connection Loss Recovery
1. Establish WebSocket connection
2. Send messages to verify communication
3. Kill WebSocket server
4. Verify client reconnection attempts
5. Restart server
6. Verify automatic reconnection

#### Invalid Message Handling
1. Send malformed JSON to WebSocket
2. Send messages without required fields
3. Send unauthorized product selection (non-vendor)
4. Verify graceful error handling

#### Concurrent User Testing
1. Open 10+ client connections
2. Have vendor present products
3. Send chat messages from multiple users
4. Verify system stability under load
5. Check message delivery reliability

## Test Data and Scenarios

### Pre-configured Test Users
- **Vendor**: userId=8888, role=vendor
- **Client 1**: userId=8889, role=viewer
- **Client 2**: userId=8890, role=viewer
- **Client 3**: userId=8891, role=viewer

### Test Room Configuration
- **Default Room**: roomId=test-room
- **Alternative Room**: roomId=test-room-2
- **Cleanup**: All rooms removed after test completion

### Sample Test Products
```javascript
const testProducts = [
  {
    id: "prod1",
    name: "iPhone 15 Pro",
    price: 999.99,
    image: "/images/iphone.jpg",
    description: "Latest iPhone with advanced features"
  },
  {
    id: "prod2",
    name: "MacBook Air M2",
    price: 1199.99,
    image: "/images/macbook.jpg",
    description: "Lightweight laptop with M2 chip"
  }
];
```

## Test Success Criteria

### WebRTC Calling
- ✅ Call establishment within 5 seconds
- ✅ Audio/video quality acceptable
- ✅ Button states match specification exactly
- ✅ Call termination works from both ends
- ✅ No memory leaks during extended calls

### Live Shopping
- ✅ Product presentation visible to all viewers within 1 second
- ✅ Chat messages delivered to all participants
- ✅ Room isolation maintained (no cross-room communication)
- ✅ Participant counts update correctly
- ✅ Vendor role restrictions enforced

### System Stability
- ✅ Server handles 20+ concurrent connections
- ✅ No crashes during 1-hour test period
- ✅ Memory usage remains stable
- ✅ All endpoints respond within 200ms
- ✅ Error handling graceful and informative

## Troubleshooting Common Issues

### Connection Refused Errors
**Symptom**: ERR_CONNECTION_REFUSED on any endpoint
**Solution**: 
1. Verify all servers are running
2. Check port availability
3. Review server startup logs
4. Ensure no firewall blocking

### WebSocket Connection Issues
**Symptom**: WebSocket fails to connect
**Solution**:
1. Check WebSocket server is running on port 3008
2. Verify URL uses ws:// not http://
3. Check browser console for CORS errors
4. Test with WebSocket client tool

### Import/Build Errors
**Symptom**: 500 errors or import failures
**Solution**:
1. Check file extensions (.jsx vs .tsx)
2. Verify import paths are correct
3. Restart Vite development server
4. Check for case sensitivity issues

### Product Synchronization Failures
**Symptom**: Products not appearing on client side
**Solution**:
1. Verify vendor role assignment
2. Check WebSocket connection status
3. Review browser console for errors
4. Test with simple product data first

This comprehensive test suite ensures thorough validation of all Live Shopping + WebRTC features before production deployment.