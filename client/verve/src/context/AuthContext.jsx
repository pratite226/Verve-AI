import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";
import { disconnectSocket } from "../services/socket";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("verve_token");

    if (!token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }

    let cancelled = false;

    api
      .get("/auth/me")
      .then((res) => {
        if (!cancelled) setUser(res.data.user || res.data);
      })
      .catch(() => {
        if (!cancelled) {
          localStorage.removeItem("verve_token");
          setUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const signup = async (payload) => {
    await api.post("/auth/signup", payload);
    // signup endpoint returns { success, message } only — no token yet,
    // so we log in immediately after to get the token and user object.
    const loginData = await api.post("/auth/login", {
      email: payload.email,
      password: payload.password,
    });
    localStorage.setItem("verve_token", loginData.data.token);
    setUser(loginData.data.user);
    return loginData.data;
  };

  const login = async (payload) => {
    const { data } = await api.post("/auth/login", payload);
    localStorage.setItem("verve_token", data.token);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem("verve_token");
    setUser(null);
    disconnectSocket();
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);