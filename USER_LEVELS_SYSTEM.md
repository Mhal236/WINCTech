# User Levels System Documentation

## Overview
The WINTechnician app now uses a 4-level user hierarchy system for managing technician permissions and access levels.

## User Levels

### 1. **Pending** (`pending`)
- **Description**: New users who have signed up but are not yet verified
- **Access**: Basic user interface only (Contact, Settings)
- **Typical Use**: New technician applicants awaiting approval

### 2. **Pro-1** (`pro-1`)
- **Description**: Entry-level verified technicians
- **Access**: Home, Jobs, Calendar, History - full technician workflow access
- **Typical Use**: New technicians who have been approved and can work independently

### 3. **Pro-2** (`pro-2`)
- **Description**: Advanced technicians with additional privileges
- **Access**: Full technician features + some administrative functions
- **Typical Use**: Experienced technicians, team leads

### 4. **Admin** (`admin`)
- **Description**: Full system administrators
- **Access**: Complete access to all features and administrative functions
- **Typical Use**: System administrators, management

## Database Structure

### Tables Involved
- `app_users`: Stores user roles and verification status
- `technicians`: Stores technician-specific data and operational status
- `applications`: Stores technician applications with approval status

### Automatic Technician Creation
When an application is approved (status changed to `pro-1`, `pro-2`, or `approved`), the system automatically:
1. Creates a record in the `technicians` table
2. Copies relevant data from the application
3. Updates the user's role in `app_users`
4. Sets verification status to 'verified'

## API Functions

### Database Functions
- `copy_application_to_technician(application_id)`: Copies approved application to technicians table
- `create_technician_from_signup(...)`: Creates technician directly from signup data
- `auto_create_technician()`: Trigger function for automatic creation

### Frontend Service
- `TechnicianService.createTechnicianFromSignup()`: Create technician from frontend
- `TechnicianService.copyApplicationToTechnician()`: Copy application data
- `TechnicianService.updateTechnicianStatus()`: Update technician level
- `TechnicianService.getTechnicianByUserId()`: Get technician data

## Status Mapping

### Application Status → Technician Status
- `pending` → `pending`
- `approved` → `pro-1`
- `pro-1` → `pro-1`
- `pro-2` → `pro-2`
- `rejected` → `pending`

### Permission Hierarchy
- **Admin**: Can access everything
- **Pro-2**: Can access all features including administrative functions
- **Pro-1**: Can access Home, Jobs, Calendar, History, and basic user features
- **Pending**: Can access basic user content only (Home, Contact, Settings)

## Usage Examples

### Approve an Application
```sql
UPDATE applications SET status = 'pro-1' WHERE id = 'application-uuid';
-- This automatically creates a technician record with pro-1 status
```

### Create Technician Directly
```typescript
import { TechnicianService } from '@/services/technicianService';

const result = await TechnicianService.createTechnicianFromSignup(userId, {
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+44 123 456 7890',
  initialStatus: 'pro-1'
});
```

### Check Permissions
```typescript
// In React component
const { hasPermission } = useAuth();

// Check if user can access admin features
if (hasPermission('admin')) {
  // Show admin interface
}

// Check if user can access pro-1 features  
if (hasPermission('pro-1')) {
  // Show job assignment features
}
```

## Migration Notes
- Existing `staff` users are treated as `pro-2`
- Existing `user` users are treated as `pending`
- Legacy role names are supported for backward compatibility
- All existing data has been migrated to the new system

## Security Considerations
- User roles are validated at both database and application levels
- Permission checks are performed before accessing protected features
- Technician creation requires proper authentication and authorization
- Status changes are logged and tracked
