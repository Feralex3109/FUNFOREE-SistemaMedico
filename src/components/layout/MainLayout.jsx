import { useState } from "react";
import { Box, Toolbar, useMediaQuery, useTheme } from "@mui/material";
import Sidebar, { DRAWER_WIDTH } from "./Sidebar";
import Topbar from "./Topbar";

export default function MainLayout({ children }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      <Sidebar
        open={sidebarOpen}
        variant={isMobile ? "temporary" : "persistent"}
        onClose={() => setSidebarOpen(false)}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          transition: "all 0.2s ease",
          ml: !isMobile && sidebarOpen ? 0 : 0,
        }}
      >
        <Topbar onToggleSidebar={toggleSidebar} sidebarOpen={!isMobile && sidebarOpen} />
        <Toolbar sx={{ minHeight: 64 }} />
        <Box sx={{ p: { xs: 2, md: 3 } }}>{children}</Box>
      </Box>
    </Box>
  );
}
