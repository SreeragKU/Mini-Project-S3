import React, { useState, useEffect, useContext } from "react";
import { Menu, Layout } from "antd";
import Link from "next/link";
import {
  PushpinOutlined,
  CameraOutlined,
  ContainerFilled,
  SettingOutlined,
  RetweetOutlined,
  UserOutlined,
  CommentOutlined,
} from "@ant-design/icons";

import { AuthContext } from "../../context/auth";
import { ThemeContext } from "../../context/theme";

const { SubMenu } = Menu;
const { Sider } = Layout;

const SubscriberNav = () => {
  const [current, setCurrent] = useState("");
  const [activeSubMenu, setActiveSubMenu] = useState("");
  const [auth, setAuth] = useContext(AuthContext);
  const [theme] = useContext(ThemeContext);

  const [collapsed, setCollapsed] = useState(false);
  const handleResize = () => {
    setCollapsed(window.innerWidth < 1000);
  };

  useEffect(() => {
    setCurrent(window.location.pathname);
    const currentPathSegments = window.location.pathname.split("/");
    if (currentPathSegments.length >= 3) {
      setActiveSubMenu(`/${currentPathSegments[1]}`);
    } else {
      setActiveSubMenu("");
    }

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    handleResize();
  }, []);

  const customStyles = {
    sider: {
      width: collapsed ? 50 : 100,
      height: "100vh",
      transition: "width 0.3s cubic-bezier(0.645, 0.045, 0.355, 1)",
      overflow: "hidden",
      paddingTop: "64px",
    },
    fixedSider: {
      position: "fixed",
      top: 0,
      left: 0,
      height: "100vh",
      zIndex: 1000,
      background: theme === "dark" ? "#001529" : "#fff",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
    },
    menu: {
      background: theme === "dark" ? "#001529" : "#fff",
      height: "calc(100% - 64px)",
      overflowY: "auto",
      overflowX: "hidden", 
      scrollbarWidth: "thin",
      WebkitOverflowScrolling: "touch", 
    },
    item: {
      background: "transparent",
      transition: "background 0.3s",
    },
    itemHover: {
      background: theme === "dark" ? "#004080" : "#4da1ff",
    },
    text: {
      color: theme === "dark" ? "#fff" : "#000",
    },
    activeItem: {
      background: theme === "dark" ? "#007F7F" : "#00BFFF",
      color: "#fff",
    },

    activeSubMenu: {
      background: theme === "dark" ? "#007F7F" : "#00BFFF",
      color: "#fff",
      transition: "width 0.3s cubic-bezier(0.645, 0.045, 0.355, 1) 0.1s",
    },
    subMenu: {
      width: collapsed ? "auto" : "100%",
    },
    subMenuItem: {
      width: "100%",
    },
  };

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={() => setCollapsed(!collapsed)}
      style={{ ...customStyles.sider, ...customStyles.fixedSider }}
    >
      <Menu
        defaultOpenKeys={["2", "6", "10"]}
        mode="inline"
        inlineCollapsed={collapsed}
        selectedKeys={[current]}
        style={customStyles.menu}
        theme={theme}
      >
        <Menu.Item
          key="/subscriber"
          icon={<SettingOutlined />}
          className={current === "/subscriber" ? "active" : ""}
          style={
            current === "/subscriber" ? customStyles.activeItem : customStyles.item
          }
        >
          <Link href="/subscriber">Dashboard</Link>
        </Menu.Item>
        <Menu.Item
          key="/subscriber/library"
          icon={<ContainerFilled />}
          className={current === "/subscriber/library" ? "active" : ""}
          style={
            current === "/subscriber/library" ? customStyles.activeItem : customStyles.item
          }
        >
          <Link href="/subscriber/library">Library</Link>
        </Menu.Item>
        <Menu.Item
          key="/subscriber/comments"
          icon={<CommentOutlined />}
          className={current === "/subscriber/comments" ? "active" : ""}
          style={
            current === "/subscriber/comments"
              ? customStyles.activeItem
              : customStyles.item
          }
        >
          <Link href="/subscriber/comments">Comments</Link>
        </Menu.Item>

        <SubMenu key="6" icon={<CameraOutlined />} title="Media">
          <Menu.Item
            key="/subscriber/media/library"
            className={current === "/subscriber/media/library" ? "active" : ""}
            style={
              current === "/subscriber/media/library"
                ? customStyles.activeItem
                : customStyles.item
            }
          >
            <Link href="/subscriber/media/library">Media Library</Link>
          </Menu.Item>
          <Menu.Item
            key="/subscriber/media/new"
            className={current === "/subscriber/media/new" ? "active" : ""}
            style={
              current === "/subscriber/media/new"
                ? customStyles.activeItem
                : customStyles.item
            }
          >
            <Link href="/subscriber/media/new">Add New Media</Link>
          </Menu.Item>
        </SubMenu>

        <Menu.Item
          key={`/subscriber/${auth?.user?._id}`}
          icon={<UserOutlined />}
          className={current === `/subscriber/${auth?.user?._id}` ? "active" : ""}
          style={
            current === `/subscriber/${auth?.user?._id}`
              ? customStyles.activeItem
              : customStyles.item
          }
        >
          <Link href={`/subscriber/${auth?.user?._id}`}>Profile</Link>
        </Menu.Item>
      </Menu>
    </Sider>
  );
};

export default SubscriberNav;
