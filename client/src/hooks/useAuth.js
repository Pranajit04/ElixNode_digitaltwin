import { useEffect } from "react";
import useAppStore from "../store";
import { getStoredUser } from "../services/auth";

function useAuth() {
  const setUser = useAppStore((state) => state.setUser);

  useEffect(() => {
    setUser(getStoredUser());
  }, [setUser]);
}

export default useAuth;
