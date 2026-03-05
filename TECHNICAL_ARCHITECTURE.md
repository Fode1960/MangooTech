# Technical Architecture Documentation

## WebRTC Implementation Architecture

### Signaling Protocol Design
The WebRTC implementation uses a custom signaling protocol over WebSocket connections. The system supports two approaches:

1. **Room-Based Broadcasting** (Current Implementation)
   - All messages broadcast to room participants
   - Uses 'join-live-shopping' for room membership
   - Messages relayed through default broadcast mechanism

2. **Dedicated Signaling** (Recommended for Production)
   - Separate WebSocket server for WebRTC signaling
   - Handles 'register', 'call-offer', 'call-answer', 'ice-candidate' messages
   - Cleaner separation of concerns

### WebRTC Connection Flow
```
1. Caller (8888) → WebSocket: 'call-offer' with SDP
2. Server → Callee (8889): 'call-offer' relay
3. Callee (8889) → WebSocket: 'call-answer' with SDP
4. Server → Caller (8888): 'call-answer' relay
5. Both parties: Exchange ICE candidates
6. Connection established
```

### Button State Management
The WebRTC component implements a precise state machine with three main states:

**State Transitions**:
- **Idle** → **Calling**: Caller initiates call
- **Calling** → **In-Call**: Callee answers
- **Calling** → **Idle**: Caller hangs up or callee rejects
- **Incoming-Call** → **In-Call**: Callee answers
- **Incoming-Call** → **Idle**: Callee rejects or caller hangs up
- **In-Call** → **Idle**: Either party hangs up

## Live Shopping Architecture

### Room Management System
The RoomManager class provides centralized room state management with the following responsibilities:

**Core Operations**:
- Room creation and lifecycle management
- Participant addition/removal with role-based access
- Message broadcasting with optional exclusion
- Role-based message filtering
- Room state persistence and cleanup

**Data Structures**:
```javascript
Room = {
  id: string,
  vendor: WebSocket | null,
  participants: Map<userId, { ws, role, name }>,
  messages: Array<message>,
  currentProduct: Product | null,
  createdAt: Date
}
```

### Product Synchronization Strategy
Product presentation uses a push-based synchronization model:

1. **Vendor Action**: Vendor selects product and sends 'product-selected' message
2. **Server Processing**: Server validates vendor role and updates room state
3. **Broadcast**: Server sends 'product-selected' to all room participants
4. **Client Update**: All clients update their UI with new product information

**Product Data Structure**:
```typescript
Product = {
  id: string,
  name: string,
  price: number,
  image: string,
  description: string
}
```

### Chat System Design
The chat system implements a lightweight messaging solution with:

**Features**:
- Message history (last 50 messages per room)
- Real-time delivery to all participants
- Timestamp-based ordering
- User identification with fallback to userId

**Message Flow**:
```
Client → 'live-chat-message' → Server
Server → Validate and store → Broadcast to room
All Clients → Receive and display message
```

## Frontend Architecture

### React Component Structure
The frontend uses a modular component architecture with clear separation of concerns:

**Main Components**:
- `WebRTCTest`: Test launcher and parameter configuration
- `SimpleLiveShoppingTest`: Complete live shopping interface
- `WebRTCCall`: Standalone WebRTC calling component

**State Management**:
- Local component state for UI interactions
- WebSocket connection state management
- Message queue for chat history
- Product state synchronization

### WebSocket Connection Management
The frontend implements robust WebSocket connection handling:

**Connection Lifecycle**:
1. Connection establishment with automatic retry
2. Message type routing based on server responses
3. Error handling and connection recovery
4. Graceful disconnection on component unmount

**Message Handling**:
```typescript
switch (data.type) {
  case 'room-state':
    updateRoomState(data.data);
    break;
  case 'product-selected':
    setCurrentProduct(data.data);
    break;
  case 'live-chat-message':
    addMessage(data.data);
    break;
  // ... other message types
}
```

## Server Architecture

### Multi-Server Deployment Strategy
The system uses a distributed server architecture with specialized roles:

**Server Responsibilities**:
- **Port 3008**: Live Shopping WebSocket server (rooms, chat, products)
- **Port 3015**: Test server (static content, room monitoring)
- **Port 3016**: React development server (Vite)

### REST API Design
The Live Shopping server provides REST endpoints for room management:

**Endpoints**:
- `GET /api/live-shopping/rooms/active`: Room discovery
- `GET /api/live-shopping/room/:roomId`: Room details
- `POST /api/live-shopping/test/cleanup`: Test cleanup

**Response Formats**:
```json
// Room list response
{
  "rooms": [
    {
      "id": "room123",
      "viewerCount": 5,
      "hasVendor": true,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}

// Room details response
{
  "room": {
    "id": "room123",
    "participants": [...],
    "currentProduct": {...},
    "messageCount": 25
  }
}
```

## Error Handling and Recovery

### WebSocket Error Handling
The system implements comprehensive error handling at multiple levels:

**Connection Errors**:
- Automatic reconnection on connection loss
- Exponential backoff for retry attempts
- Graceful degradation when server unavailable

**Message Errors**:
- Validation of message format and required fields
- Role-based access control enforcement
- Error notification to clients

### Build and Deployment Error Resolution
Several critical errors were resolved during implementation:

**Import Resolution**:
- Fixed TypeScript/JavaScript import mismatches
- Resolved component import paths in App.jsx
- Corrected file extension handling

**Port Management**:
- Resolved EADDRINUSE conflicts
- Established consistent port allocation
- Implemented strict port binding

**Module System**:
- Migrated CommonJS to ESM where needed
- Resolved require/import conflicts
- Maintained compatibility across components

## Performance Considerations

### WebSocket Message Optimization
- Message batching for high-frequency updates
- Efficient room broadcasting with optional exclusion
- Memory management for chat history (50 message limit)

### Frontend Performance
- Lazy loading of test components
- Efficient re-rendering with React optimization
- WebSocket connection pooling

### Server Performance
- Efficient room lookup with Map data structures
- Participant management with O(1) operations
- Message broadcasting with minimal overhead

## Security Considerations

### Current Test Implementation
The current implementation prioritizes testing convenience over security:
- Authentication bypassed for test routes
- No input validation on WebSocket messages
- Open CORS policies for development

### Production Recommendations
- Implement proper authentication and authorization
- Add input validation and sanitization
- Secure WebSocket connections with WSS
- Implement rate limiting for message sending
- Add room access controls and permissions

## Testing Strategy

### Test Infrastructure
Comprehensive test infrastructure with multiple entry points:

**Test Pages**:
- Multi-room test interface for parallel testing
- Simple live shopping test for focused testing
- WebRTC test launcher for calling functionality

**Test Scenarios**:
- Vendor-client interaction flow
- Multi-viewer product synchronization
- WebRTC calling with button state verification
- Room lifecycle management

**Monitoring Tools**:
- Room activity monitoring via REST API
- Real-time participant tracking
- Message history inspection
- Cleanup utilities for test data

This architecture provides a robust foundation for live shopping with WebRTC capabilities while maintaining flexibility for future enhancements and production deployment.