import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Switch,
  FormControlLabel,
  Grid,
  Divider,
  Alert,
  Stack,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  Person,
  Email,
  Lock,
  CheckCircle,
  Cancel,
} from "@mui/icons-material";
import {
  useGetAdminsQuery,
  useCreateAdminMutation,
  useUpdateAdminMutation,
  useDeleteAdminMutation,
} from "../../store/api/adminsApi";

const UsersManagement = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));

  // RTK Query hooks
  const { data: users = [], isLoading, error } = useGetAdminsQuery();
  const [createAdmin, { isLoading: isCreating }] = useCreateAdminMutation();
  const [updateAdmin, { isLoading: isUpdating }] = useUpdateAdminMutation();
  const [deleteAdmin] = useDeleteAdminMutation();

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  // Form state
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    can_access_dashboard: false,
    can_access_reports: false,
    can_access_service_management: false,
    can_access_location: false,
    can_access_house_size_management: false,
    can_access_addon_service: false,
    can_access_coupon: false,
    can_access_on_the_go_calculator: false,
    is_active: true,
  });

  const handleOpenDialog = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username || "",
        email: user.email || "",
        password: "", // Don't pre-fill password
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        can_access_dashboard: user.can_access_dashboard || false,
        can_access_reports: user.can_access_reports || false,
        can_access_service_management:
          user.can_access_service_management || false,
        can_access_location: user.can_access_location || false,
        can_access_house_size_management:
          user.can_access_house_size_management || false,
        can_access_addon_service: user.can_access_addon_service || false,
        can_access_coupon: user.can_access_coupon || false,
        can_access_on_the_go_calculator:
          user.can_access_on_the_go_calculator || false,
        is_active: user.is_active !== undefined ? user.is_active : true,
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: "",
        email: "",
        password: "",
        first_name: "",
        last_name: "",
        can_access_dashboard: false,
        can_access_reports: false,
        can_access_service_management: false,
        can_access_location: false,
        can_access_house_size_management: false,
        can_access_addon_service: false,
        can_access_coupon: false,
        can_access_on_the_go_calculator: false,
        is_active: true,
      });
    }
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingUser(null);
    setFormErrors({});
    setFormData({
      username: "",
      email: "",
      password: "",
      first_name: "",
      last_name: "",
      can_access_dashboard: false,
      can_access_reports: false,
      can_access_service_management: false,
      can_access_location: false,
      can_access_house_size_management: false,
      can_access_addon_service: false,
      can_access_coupon: false,
      can_access_on_the_go_calculator: false,
      is_active: true,
    });
  };

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.username?.trim()) {
      errors.username = "Username is required";
    }

    if (!formData.email?.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!editingUser && !formData.password?.trim()) {
      errors.password = "Password is required for new users";
    } else if (formData.password && formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }

    if (!formData.first_name?.trim()) {
      errors.first_name = "First name is required";
    }

    if (!formData.last_name?.trim()) {
      errors.last_name = "Last name is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveUser = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const userData = { ...formData };

      // Remove password from update if it's empty (for updates)
      if (editingUser && !userData.password) {
        delete userData.password;
      }

      if (editingUser) {
        await updateAdmin({
          id: editingUser.id,
          ...userData,
        }).unwrap();
      } else {
        await createAdmin(userData).unwrap();
      }

      handleCloseDialog();
    } catch (error) {
      console.error("Failed to save user:", error);
      if (error?.data) {
        // Handle API validation errors
        const apiErrors = {};
        Object.keys(error.data).forEach((key) => {
          if (Array.isArray(error.data[key])) {
            apiErrors[key] = error.data[key][0];
          } else {
            apiErrors[key] = error.data[key];
          }
        });
        setFormErrors(apiErrors);
      } else {
        setFormErrors({ general: "Failed to save user. Please try again." });
      }
    }
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    try {
      await deleteAdmin(userToDelete.id).unwrap();
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch (error) {
      console.error("Failed to delete user:", error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPermissionCount = (user) => {
    const permissions = [
      "can_access_dashboard",
      "can_access_reports",
      "can_access_service_management",
      "can_access_location",
      "can_access_house_size_management",
      "can_access_addon_service",
      "can_access_coupon",
      "can_access_on_the_go_calculator",
    ];
    return permissions.filter((perm) => user[perm]).length;
  };

  // Mobile Card View Component
  const UserCard = ({ user }) => (
    <Card
      sx={{
        mb: 2,
        boxShadow: 2,
        "&:hover": { boxShadow: 4 },
        transition: "box-shadow 0.3s",
      }}
    >
      <CardContent>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="flex-start"
          mb={2}
        >
          <Box display="flex" alignItems="center" flex={1}>
            <Person color="primary" sx={{ mr: 1.5 }} />
            <Box>
              <Typography variant="h6" fontWeight="bold">
                {user.first_name} {user.last_name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                @{user.username}
              </Typography>
            </Box>
          </Box>
          <Box display="flex" gap={0.5}>
            <IconButton
              size="small"
              color="primary"
              onClick={() => handleOpenDialog(user)}
            >
              <Edit fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              color="error"
              onClick={() => handleDeleteClick(user)}
            >
              <Delete fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        <Divider sx={{ mb: 2 }} />

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <Email fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                {user.email}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary" display="block">
              Status
            </Typography>
            <Chip
              label={user.is_active ? "Active" : "Inactive"}
              size="small"
              color={user.is_active ? "success" : "default"}
              icon={user.is_active ? <CheckCircle /> : <Cancel />}
              sx={{ mt: 0.5 }}
            />
          </Grid>

          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary" display="block">
              Role
            </Typography>
            <Chip
              label={user.is_super_admin ? "Super Admin" : "Admin"}
              size="small"
              color={user.is_super_admin ? "warning" : "primary"}
              variant="outlined"
              sx={{ mt: 0.5 }}
            />
          </Grid>

          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary" display="block">
              Permissions
            </Typography>
            <Chip
              label={`${getPermissionCount(user)} permissions`}
              size="small"
              variant="outlined"
              color="primary"
              sx={{ mt: 0.5 }}
            />
          </Grid>

          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary" display="block">
              Created
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              {formatDate(user.created_at)}
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Alert severity="error">
          Error loading users:{" "}
          {error?.data?.message || error?.message || "Unknown error"}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ px: { xs: 1, sm: 0 } }}>
      <Box
        display="flex"
        flexDirection={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        mb={3}
        gap={2}
      >
        <Box>
          <Typography
            variant={isMobile ? "h5" : "h4"}
            component="h1"
            gutterBottom
            className="text-foreground font-bold"
          >
            Users Management
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}
          >
            Manage admin users, permissions, and access controls
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
          fullWidth={isMobile}
          size={isMobile ? "medium" : "large"}
          sx={{
            backgroundColor: "hsl(var(--primary))",
            "&:hover": {
              backgroundColor: "hsl(var(--primary) / 0.9)",
            },
          }}
        >
          Create New User
        </Button>
      </Box>

      {/* Mobile Card View */}
      {isMobile ? (
        <Box>
          {users.length === 0 ? (
            <Card>
              <CardContent>
                <Box textAlign="center" py={4}>
                  <Person sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
                  <Typography variant="body1" color="text.secondary" gutterBottom>
                    No users found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Create your first user to get started
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          ) : (
            users.map((user) => <UserCard key={user.id} user={user} />)
          )}
        </Box>
      ) : (
        /* Desktop/Tablet Table View */
        <Card>
          <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
            <TableContainer
              component={Paper}
              variant="outlined"
              sx={{
                maxHeight: { xs: "70vh", md: "none" },
                overflowX: "auto",
              }}
            >
              <Table size={isTablet ? "small" : "medium"}>
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Permissions</TableCell>
                    {!isTablet && <TableCell>Role</TableCell>}
                    {!isTablet && <TableCell>Created</TableCell>}
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={isTablet ? 5 : 7}
                        align="center"
                        sx={{ py: 4 }}
                      >
                        <Box textAlign="center">
                          <Person
                            sx={{ fontSize: 48, color: "text.secondary", mb: 2 }}
                          />
                          <Typography variant="body1" color="text.secondary" gutterBottom>
                            No users found
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Create your first user to get started
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow
                        key={user.id}
                        sx={{
                          "&:hover": {
                            backgroundColor: "action.hover",
                          },
                        }}
                      >
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <Person color="primary" sx={{ mr: 1 }} />
                            <Box>
                              <Typography variant="subtitle2" fontWeight="bold">
                                {user.first_name} {user.last_name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                @{user.username}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{
                              maxWidth: { xs: "150px", sm: "200px" },
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {user.email}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={user.is_active ? "Active" : "Inactive"}
                            size="small"
                            color={user.is_active ? "success" : "default"}
                            icon={user.is_active ? <CheckCircle /> : <Cancel />}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={`${getPermissionCount(user)} permissions`}
                            size="small"
                            variant="outlined"
                            color="primary"
                          />
                        </TableCell>
                        {!isTablet && (
                          <TableCell>
                            <Chip
                              label={user.is_super_admin ? "Super Admin" : "Admin"}
                              size="small"
                              color={user.is_super_admin ? "warning" : "primary"}
                              variant="outlined"
                            />
                          </TableCell>
                        )}
                        {!isTablet && (
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {formatDate(user.created_at)}
                            </Typography>
                          </TableCell>
                        )}
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleOpenDialog(user)}
                            sx={{ mr: 0.5 }}
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteClick(user)}
                          >
                            <Delete />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit User Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="lg"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: { xs: 0, sm: 2 },
            maxHeight: { xs: "100vh", sm: "90vh" },
            m: { xs: 0, sm: 2 },
          },
        }}
      >
        <DialogTitle
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            pb: { xs: 1.5, sm: 2 },
            px: { xs: 2, sm: 3 },
            pt: { xs: 2, sm: 3 },
            position: "sticky",
            top: 0,
            backgroundColor: "background.paper",
            zIndex: 1,
          }}
        >
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
          >
            <Box sx={{ flex: 1 }}>
              <Typography
                variant={isMobile ? "h6" : "h5"}
                fontWeight="600"
                sx={{ fontSize: { xs: "1.125rem", sm: "1.5rem" } }}
              >
                {editingUser ? "Edit User" : "Create New User"}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mt: { xs: 0.5, sm: 0.5 },
                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                  display: { xs: "none", sm: "block" },
                }}
              >
                {editingUser
                  ? "Update user information and permissions"
                  : "Set up a new admin user with specific access controls"}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent
          sx={{
            pt: { xs: 2, sm: 3 },
            px: { xs: 2, sm: 3 },
            pb: { xs: 1, sm: 3 },
            "&::-webkit-scrollbar": {
              width: "6px",
            },
            "&::-webkit-scrollbar-track": {
              backgroundColor: "transparent",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "rgba(0,0,0,0.15)",
              borderRadius: "3px",
            },
          }}
        >
          {formErrors.general && (
            <Alert
              severity="error"
              sx={{
                mb: { xs: 2, sm: 3 },
                fontSize: { xs: "0.875rem", sm: "1rem" },
              }}
            >
              {formErrors.general}
            </Alert>
          )}

          <Stack spacing={{ xs: 2.5, sm: 4 }}>
            {/* Basic Information Section */}
            <Box>
              <Box
                display="flex"
                alignItems="center"
                mb={{ xs: 1.5, sm: 2 }}
                sx={{
                  pb: { xs: 1, sm: 0 },
                  borderBottom: { xs: "1px solid", sm: "none" },
                  borderColor: { xs: "divider", sm: "transparent" },
                }}
              >
                <Person
                  sx={{
                    mr: { xs: 1, sm: 1.5 },
                    color: "primary.main",
                    fontSize: { xs: 18, sm: 24 },
                  }}
                />
                <Typography
                  variant={isMobile ? "subtitle2" : "h6"}
                  fontWeight="600"
                  sx={{ fontSize: { xs: "0.9375rem", sm: "1.25rem" } }}
                >
                  Basic Information
                </Typography>
              </Box>

              <Grid container spacing={{ xs: 2, sm: 2 }}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Username"
                    value={formData.username}
                    onChange={(e) =>
                      handleFormChange("username", e.target.value)
                    }
                    error={!!formErrors.username}
                    helperText={formErrors.username}
                    required
                    disabled={!!editingUser}
                    size={isMobile ? "small" : "medium"}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        backgroundColor: editingUser
                          ? "action.hover"
                          : "background.paper",
                        fontSize: { xs: "0.875rem", sm: "1rem" },
                      },
                      "& .MuiInputLabel-root": {
                        fontSize: { xs: "0.875rem", sm: "1rem" },
                      },
                      "& .MuiFormHelperText-root": {
                        fontSize: { xs: "0.75rem", sm: "0.875rem" },
                        mx: 0,
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Email Address"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleFormChange("email", e.target.value)}
                    error={!!formErrors.email}
                    helperText={formErrors.email}
                    required
                    size={isMobile ? "small" : "medium"}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        fontSize: { xs: "0.875rem", sm: "1rem" },
                      },
                      "& .MuiInputLabel-root": {
                        fontSize: { xs: "0.875rem", sm: "1rem" },
                      },
                      "& .MuiFormHelperText-root": {
                        fontSize: { xs: "0.75rem", sm: "0.875rem" },
                        mx: 0,
                      },
                    }}
                    InputProps={{
                      startAdornment: (
                        <Email
                          sx={{
                            mr: 1,
                            color: "text.secondary",
                            fontSize: { xs: "1rem", sm: "1.25rem" },
                          }}
                        />
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    value={formData.first_name}
                    onChange={(e) =>
                      handleFormChange("first_name", e.target.value)
                    }
                    error={!!formErrors.first_name}
                    helperText={formErrors.first_name}
                    required
                    size={isMobile ? "small" : "medium"}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        fontSize: { xs: "0.875rem", sm: "1rem" },
                      },
                      "& .MuiInputLabel-root": {
                        fontSize: { xs: "0.875rem", sm: "1rem" },
                      },
                      "& .MuiFormHelperText-root": {
                        fontSize: { xs: "0.75rem", sm: "0.875rem" },
                        mx: 0,
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    value={formData.last_name}
                    onChange={(e) =>
                      handleFormChange("last_name", e.target.value)
                    }
                    error={!!formErrors.last_name}
                    helperText={formErrors.last_name}
                    required
                    size={isMobile ? "small" : "medium"}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        fontSize: { xs: "0.875rem", sm: "1rem" },
                      },
                      "& .MuiInputLabel-root": {
                        fontSize: { xs: "0.875rem", sm: "1rem" },
                      },
                      "& .MuiFormHelperText-root": {
                        fontSize: { xs: "0.75rem", sm: "0.875rem" },
                        mx: 0,
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label={editingUser ? "New Password" : "Password"}
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      handleFormChange("password", e.target.value)
                    }
                    error={!!formErrors.password}
                    helperText={
                      formErrors.password ||
                      (editingUser
                        ? "Leave blank to keep current password. Minimum 8 characters if changing."
                        : "Minimum 8 characters required")
                    }
                    required={!editingUser}
                    size={isMobile ? "small" : "medium"}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        fontSize: { xs: "0.875rem", sm: "1rem" },
                      },
                      "& .MuiInputLabel-root": {
                        fontSize: { xs: "0.875rem", sm: "1rem" },
                      },
                      "& .MuiFormHelperText-root": {
                        fontSize: { xs: "0.75rem", sm: "0.875rem" },
                        mx: 0,
                        mt: { xs: 0.5, sm: 0.5 },
                      },
                    }}
                    InputProps={{
                      startAdornment: (
                        <Lock
                          sx={{
                            mr: 1,
                            color: "text.secondary",
                            fontSize: { xs: "1rem", sm: "1.25rem" },
                          }}
                        />
                      ),
                    }}
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: { xs: 0.5, sm: 0 } }} />

            {/* Permissions Section - AWS Style */}
            <Box>
              <Box
                mb={{ xs: 1.5, sm: 3 }}
                sx={{
                  pb: { xs: 1, sm: 0 },
                  borderBottom: { xs: "1px solid", sm: "none" },
                  borderColor: { xs: "divider", sm: "transparent" },
                }}
              >
                <Typography
                  variant={isMobile ? "subtitle2" : "h6"}
                  fontWeight="600"
                  gutterBottom
                  sx={{ fontSize: { xs: "0.9375rem", sm: "1.25rem" } }}
                >
                  Permissions
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    display: { xs: "none", sm: "block" },
                    fontSize: { xs: "0.75rem", sm: "0.875rem" },
                  }}
                >
                  Grant specific access permissions to different sections of the
                  admin panel
                </Typography>
              </Box>

              <Paper
                variant="outlined"
                sx={{
                  p: 0,
                  borderRadius: 2,
                  overflow: "hidden",
                }}
              >
                {/* Dashboard & Analytics */}
                <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                  <Box
                    sx={{
                      px: { xs: 2, sm: 3 },
                      py: { xs: 1.5, sm: 2 },
                      backgroundColor: "action.hover",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Typography
                      variant="caption"
                      fontWeight="600"
                      color="text.secondary"
                      sx={{ fontSize: { xs: "0.7rem", sm: "0.75rem" } }}
                    >
                      DASHBOARD & ANALYTICS
                    </Typography>
                  </Box>

                  <Box sx={{ px: { xs: 1, sm: 3 }, py: { xs: 1.5, sm: 2 } }}>
                    <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                      <Grid item xs={12} sm={6}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            p: { xs: 1.25, sm: 2 },
                            borderRadius: { xs: 1.5, sm: 1 },
                            border: 1,
                            borderColor: formData.can_access_dashboard
                              ? "primary.main"
                              : "divider",
                            backgroundColor: formData.can_access_dashboard
                              ? "primary.50"
                              : "transparent",
                            transition: "all 0.2s",
                            cursor: "pointer",
                            minHeight: { xs: "56px", sm: "auto" },
                            "&:hover": {
                              borderColor: "primary.main",
                              backgroundColor: "action.hover",
                            },
                            "&:active": {
                              transform: { xs: "scale(0.98)", sm: "none" },
                            },
                          }}
                          onClick={() =>
                            handleFormChange(
                              "can_access_dashboard",
                              !formData.can_access_dashboard
                            )
                          }
                        >
                          <Box sx={{ flex: 1, mr: { xs: 1.5, sm: 1 } }}>
                            <Typography
                              variant={isMobile ? "body2" : "body1"}
                              fontWeight="500"
                              sx={{
                                fontSize: { xs: "0.875rem", sm: "1rem" },
                                lineHeight: { xs: 1.4, sm: 1.5 },
                              }}
                            >
                              Dashboard Access
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{
                                display: { xs: "none", sm: "block" },
                                fontSize: { xs: "0.7rem", sm: "0.75rem" },
                              }}
                            >
                              View analytics and key metrics
                            </Typography>
                          </Box>
                          <Switch
                            checked={formData.can_access_dashboard}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleFormChange(
                                "can_access_dashboard",
                                e.target.checked
                              );
                            }}
                            color="primary"
                            size={isMobile ? "small" : "medium"}
                            sx={{
                              "& .MuiSwitch-switchBase": {
                                padding: { xs: "4px", sm: "9px" },
                              },
                            }}
                          />
                        </Box>
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            p: { xs: 1.25, sm: 2 },
                            borderRadius: { xs: 1.5, sm: 1 },
                            border: 1,
                            borderColor: formData.can_access_reports
                              ? "primary.main"
                              : "divider",
                            backgroundColor: formData.can_access_reports
                              ? "primary.50"
                              : "transparent",
                            transition: "all 0.2s",
                            cursor: "pointer",
                            minHeight: { xs: "56px", sm: "auto" },
                            "&:hover": {
                              borderColor: "primary.main",
                              backgroundColor: "action.hover",
                            },
                            "&:active": {
                              transform: { xs: "scale(0.98)", sm: "none" },
                            },
                          }}
                          onClick={() =>
                            handleFormChange(
                              "can_access_reports",
                              !formData.can_access_reports
                            )
                          }
                        >
                          <Box sx={{ flex: 1, mr: { xs: 1.5, sm: 1 } }}>
                            <Typography
                              variant={isMobile ? "body2" : "body1"}
                              fontWeight="500"
                              sx={{
                                fontSize: { xs: "0.875rem", sm: "1rem" },
                                lineHeight: { xs: 1.4, sm: 1.5 },
                              }}
                            >
                              Reports Access
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{
                                display: { xs: "none", sm: "block" },
                                fontSize: { xs: "0.7rem", sm: "0.75rem" },
                              }}
                            >
                              Generate and view reports
                            </Typography>
                          </Box>
                          <Switch
                            checked={formData.can_access_reports}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleFormChange(
                                "can_access_reports",
                                e.target.checked
                              );
                            }}
                            color="primary"
                            size={isMobile ? "small" : "medium"}
                            sx={{
                              "& .MuiSwitch-switchBase": {
                                padding: { xs: "4px", sm: "9px" },
                              },
                            }}
                          />
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                </Box>

                {/* Service Configuration */}
                <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                  <Box
                    sx={{
                      px: { xs: 2, sm: 3 },
                      py: { xs: 1.5, sm: 2 },
                      backgroundColor: "action.hover",
                    }}
                  >
                    <Typography
                      variant="caption"
                      fontWeight="600"
                      color="text.secondary"
                      sx={{ fontSize: { xs: "0.7rem", sm: "0.75rem" } }}
                    >
                      SERVICE CONFIGURATION
                    </Typography>
                  </Box>

                  <Box sx={{ px: { xs: 1, sm: 3 }, py: { xs: 1.5, sm: 2 } }}>
                    <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                      <Grid item xs={12} sm={6}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            p: { xs: 1.25, sm: 2 },
                            borderRadius: { xs: 1.5, sm: 1 },
                            border: 1,
                            borderColor: formData.can_access_service_management
                              ? "primary.main"
                              : "divider",
                            backgroundColor:
                              formData.can_access_service_management
                                ? "primary.50"
                                : "transparent",
                            transition: "all 0.2s",
                            cursor: "pointer",
                            minHeight: { xs: "56px", sm: "auto" },
                            "&:hover": {
                              borderColor: "primary.main",
                              backgroundColor: "action.hover",
                            },
                            "&:active": {
                              transform: { xs: "scale(0.98)", sm: "none" },
                            },
                          }}
                          onClick={() =>
                            handleFormChange(
                              "can_access_service_management",
                              !formData.can_access_service_management
                            )
                          }
                        >
                          <Box sx={{ flex: 1, mr: { xs: 1.5, sm: 1 } }}>
                            <Typography
                              variant={isMobile ? "body2" : "body1"}
                              fontWeight="500"
                              sx={{
                                fontSize: { xs: "0.875rem", sm: "1rem" },
                                lineHeight: { xs: 1.4, sm: 1.5 },
                              }}
                            >
                              Service Management
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{
                                display: { xs: "none", sm: "block" },
                                fontSize: { xs: "0.7rem", sm: "0.75rem" },
                              }}
                            >
                              Manage service offerings
                            </Typography>
                          </Box>
                          <Switch
                            checked={formData.can_access_service_management}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleFormChange(
                                "can_access_service_management",
                                e.target.checked
                              );
                            }}
                            color="primary"
                            size={isMobile ? "small" : "medium"}
                            sx={{
                              "& .MuiSwitch-switchBase": {
                                padding: { xs: "4px", sm: "9px" },
                              },
                            }}
                          />
                        </Box>
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            p: 2,
                            borderRadius: 1,
                            border: 1,
                            borderColor: formData.can_access_addon_service
                              ? "primary.main"
                              : "divider",
                            backgroundColor: formData.can_access_addon_service
                              ? "primary.50"
                              : "transparent",
                            transition: "all 0.2s",
                            cursor: "pointer",
                            "&:hover": {
                              borderColor: "primary.main",
                              backgroundColor: "action.hover",
                            },
                          }}
                          onClick={() =>
                            handleFormChange(
                              "can_access_addon_service",
                              !formData.can_access_addon_service
                            )
                          }
                        >
                          <Box sx={{ flex: 1, mr: 1 }}>
                            <Typography
                              variant={isMobile ? "body2" : "body1"}
                              fontWeight="500"
                            >
                              Add-On Services
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: { xs: "none", sm: "block" } }}
                            >
                              Manage additional services
                            </Typography>
                          </Box>
                          <Switch
                            checked={formData.can_access_addon_service}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleFormChange(
                                "can_access_addon_service",
                                e.target.checked
                              );
                            }}
                            color="primary"
                            size={isMobile ? "small" : "medium"}
                          />
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                </Box>

                {/* Location & Property */}
                <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                  <Box
                    sx={{
                      px: { xs: 2, sm: 3 },
                      py: { xs: 1.5, sm: 2 },
                      backgroundColor: "action.hover",
                    }}
                  >
                    <Typography
                      variant="caption"
                      fontWeight="600"
                      color="text.secondary"
                      sx={{ fontSize: { xs: "0.7rem", sm: "0.75rem" } }}
                    >
                      LOCATION & PROPERTY
                    </Typography>
                  </Box>

                  <Box sx={{ px: { xs: 2, sm: 3 }, py: { xs: 1.5, sm: 2 } }}>
                    <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                      <Grid item xs={12} sm={6}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            p: 2,
                            borderRadius: 1,
                            border: 1,
                            borderColor: formData.can_access_location
                              ? "primary.main"
                              : "divider",
                            backgroundColor: formData.can_access_location
                              ? "primary.50"
                              : "transparent",
                            transition: "all 0.2s",
                            cursor: "pointer",
                            "&:hover": {
                              borderColor: "primary.main",
                              backgroundColor: "action.hover",
                            },
                          }}
                          onClick={() =>
                            handleFormChange(
                              "can_access_location",
                              !formData.can_access_location
                            )
                          }
                        >
                          <Box sx={{ flex: 1, mr: 1 }}>
                            <Typography
                              variant={isMobile ? "body2" : "body1"}
                              fontWeight="500"
                            >
                              Location Management
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: { xs: "none", sm: "block" } }}
                            >
                              Manage service locations
                            </Typography>
                          </Box>
                          <Switch
                            checked={formData.can_access_location}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleFormChange(
                                "can_access_location",
                                e.target.checked
                              );
                            }}
                            color="primary"
                            size={isMobile ? "small" : "medium"}
                          />
                        </Box>
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            p: 2,
                            borderRadius: 1,
                            border: 1,
                            borderColor:
                              formData.can_access_house_size_management
                                ? "primary.main"
                                : "divider",
                            backgroundColor:
                              formData.can_access_house_size_management
                                ? "primary.50"
                                : "transparent",
                            transition: "all 0.2s",
                            cursor: "pointer",
                            "&:hover": {
                              borderColor: "primary.main",
                              backgroundColor: "action.hover",
                            },
                          }}
                          onClick={() =>
                            handleFormChange(
                              "can_access_house_size_management",
                              !formData.can_access_house_size_management
                            )
                          }
                        >
                          <Box sx={{ flex: 1, mr: 1 }}>
                            <Typography
                              variant={isMobile ? "body2" : "body1"}
                              fontWeight="500"
                            >
                              House Size Management
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: { xs: "none", sm: "block" } }}
                            >
                              Configure property sizes
                            </Typography>
                          </Box>
                          <Switch
                            checked={formData.can_access_house_size_management}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleFormChange(
                                "can_access_house_size_management",
                                e.target.checked
                              );
                            }}
                            color="primary"
                            size={isMobile ? "small" : "medium"}
                          />
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                </Box>

                {/* Marketing & Tools */}
                <Box>
                  <Box
                    sx={{
                      px: { xs: 2, sm: 3 },
                      py: { xs: 1.5, sm: 2 },
                      backgroundColor: "action.hover",
                    }}
                  >
                    <Typography
                      variant="caption"
                      fontWeight="600"
                      color="text.secondary"
                      sx={{ fontSize: { xs: "0.7rem", sm: "0.75rem" } }}
                    >
                      MARKETING & TOOLS
                    </Typography>
                  </Box>

                  <Box sx={{ px: { xs: 2, sm: 3 }, py: { xs: 1.5, sm: 2 } }}>
                    <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                      <Grid item xs={12} sm={6}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            p: 2,
                            borderRadius: 1,
                            border: 1,
                            borderColor: formData.can_access_coupon
                              ? "primary.main"
                              : "divider",
                            backgroundColor: formData.can_access_coupon
                              ? "primary.50"
                              : "transparent",
                            transition: "all 0.2s",
                            cursor: "pointer",
                            "&:hover": {
                              borderColor: "primary.main",
                              backgroundColor: "action.hover",
                            },
                          }}
                          onClick={() =>
                            handleFormChange(
                              "can_access_coupon",
                              !formData.can_access_coupon
                            )
                          }
                        >
                          <Box sx={{ flex: 1, mr: 1 }}>
                            <Typography
                              variant={isMobile ? "body2" : "body1"}
                              fontWeight="500"
                            >
                              Coupon Management
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: { xs: "none", sm: "block" } }}
                            >
                              Create and manage coupons
                            </Typography>
                          </Box>
                          <Switch
                            checked={formData.can_access_coupon}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleFormChange(
                                "can_access_coupon",
                                e.target.checked
                              );
                            }}
                            color="primary"
                            size={isMobile ? "small" : "medium"}
                          />
                        </Box>
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            p: 2,
                            borderRadius: 1,
                            border: 1,
                            borderColor:
                              formData.can_access_on_the_go_calculator
                                ? "primary.main"
                                : "divider",
                            backgroundColor:
                              formData.can_access_on_the_go_calculator
                                ? "primary.50"
                                : "transparent",
                            transition: "all 0.2s",
                            cursor: "pointer",
                            "&:hover": {
                              borderColor: "primary.main",
                              backgroundColor: "action.hover",
                            },
                          }}
                          onClick={() =>
                            handleFormChange(
                              "can_access_on_the_go_calculator",
                              !formData.can_access_on_the_go_calculator
                            )
                          }
                        >
                          <Box sx={{ flex: 1, mr: 1 }}>
                            <Typography
                              variant={isMobile ? "body2" : "body1"}
                              fontWeight="500"
                            >
                              On the Go Calculator
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: { xs: "none", sm: "block" } }}
                            >
                              Access pricing calculator
                            </Typography>
                          </Box>
                          <Switch
                            checked={formData.can_access_on_the_go_calculator}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleFormChange(
                                "can_access_on_the_go_calculator",
                                e.target.checked
                              );
                            }}
                            color="primary"
                            size={isMobile ? "small" : "medium"}
                          />
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                </Box>
              </Paper>
            </Box>

            <Divider />

            <Divider sx={{ my: { xs: 0.5, sm: 0 } }} />

            {/* Account Status */}
            <Box>
              <Box
                mb={{ xs: 1.5, sm: 2 }}
                sx={{
                  pb: { xs: 1, sm: 0 },
                  borderBottom: { xs: "1px solid", sm: "none" },
                  borderColor: { xs: "divider", sm: "transparent" },
                }}
              >
                <Typography
                  variant={isMobile ? "subtitle2" : "h6"}
                  fontWeight="600"
                  gutterBottom
                  sx={{ fontSize: { xs: "0.9375rem", sm: "1.25rem" } }}
                >
                  Account Status
                </Typography>
              </Box>
              <Paper
                variant="outlined"
                sx={{
                  p: { xs: 1.5, sm: 2.5 },
                  borderRadius: { xs: 1.5, sm: 2 },
                  border: { xs: 1.5, sm: 2 },
                  borderColor: formData.is_active
                    ? "success.main"
                    : "error.main",
                  backgroundColor: formData.is_active
                    ? "success.50"
                    : "error.50",
                }}
              >
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  flexDirection={{ xs: "row", sm: "row" }}
                  gap={{ xs: 1.5, sm: 0 }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant={isMobile ? "body2" : "body1"}
                      fontWeight="500"
                      sx={{
                        fontSize: { xs: "0.875rem", sm: "1rem" },
                        mb: { xs: 0.5, sm: 0.5 },
                      }}
                    >
                      {formData.is_active
                        ? "Account Active"
                        : "Account Inactive"}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        fontSize: { xs: "0.75rem", sm: "0.875rem" },
                        lineHeight: { xs: 1.4, sm: 1.5 },
                      }}
                    >
                      {formData.is_active
                        ? "User can log in and access assigned permissions"
                        : "User cannot log in to the system"}
                    </Typography>
                  </Box>
                  <Switch
                    checked={formData.is_active}
                    onChange={(e) =>
                      handleFormChange("is_active", e.target.checked)
                    }
                    color="success"
                    size={isMobile ? "small" : "medium"}
                    sx={{
                      "& .MuiSwitch-switchBase": {
                        padding: { xs: "4px", sm: "9px" },
                      },
                    }}
                  />
                </Box>
              </Paper>
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions
          sx={{
            px: { xs: 2, sm: 3 },
            py: { xs: 2, sm: 2.5 },
            borderTop: 1,
            borderColor: "divider",
            flexDirection: { xs: "column-reverse", sm: "row" },
            gap: { xs: 1, sm: 1.5 },
            position: "sticky",
            bottom: 0,
            backgroundColor: "background.paper",
            zIndex: 1,
            boxShadow: { xs: "0 -2px 8px rgba(0,0,0,0.05)", sm: "none" },
          }}
        >
          <Button
            onClick={handleCloseDialog}
            variant="outlined"
            size={isMobile ? "medium" : "large"}
            fullWidth={isMobile}
            sx={{
              minWidth: { xs: "100%", sm: 100 },
              fontSize: { xs: "0.875rem", sm: "1rem" },
              py: { xs: 1.25, sm: 1.5 },
              fontWeight: { xs: 500, sm: 400 },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveUser}
            variant="contained"
            size={isMobile ? "medium" : "large"}
            disabled={isCreating || isUpdating}
            fullWidth={isMobile}
            startIcon={
              isCreating || isUpdating ? (
                <CircularProgress size={isMobile ? 16 : 18} />
              ) : null
            }
            sx={{
              minWidth: { xs: "100%", sm: 140 },
              backgroundColor: "hsl(var(--primary))",
              fontSize: { xs: "0.875rem", sm: "1rem" },
              py: { xs: 1.25, sm: 1.5 },
              fontWeight: { xs: 600, sm: 500 },
              "&:hover": {
                backgroundColor: "hsl(var(--primary) / 0.9)",
              },
              "&:disabled": {
                backgroundColor: "hsl(var(--primary) / 0.6)",
              },
            }}
          >
            {isCreating || isUpdating
              ? editingUser
                ? "Updating..."
                : "Creating..."
              : editingUser
              ? "Update User"
              : "Create User"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: { xs: 0, sm: 2 },
            m: { xs: 0, sm: 2 },
          },
        }}
      >
        <DialogTitle sx={{ px: { xs: 2, sm: 3 } }}>Delete User</DialogTitle>
        <DialogContent sx={{ px: { xs: 2, sm: 3 } }}>
          <Typography variant={isMobile ? "body2" : "body1"}>
            Are you sure you want to delete{" "}
            <strong>
              {userToDelete?.first_name} {userToDelete?.last_name}
            </strong>{" "}
            ({userToDelete?.username})? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions
          sx={{
            px: { xs: 2, sm: 3 },
            pb: { xs: 2, sm: 2.5 },
            flexDirection: { xs: "column-reverse", sm: "row" },
            gap: { xs: 1, sm: 0 },
          }}
        >
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            variant="outlined"
            fullWidth={isMobile}
            size={isMobile ? "medium" : "large"}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            fullWidth={isMobile}
            size={isMobile ? "medium" : "large"}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UsersManagement;
