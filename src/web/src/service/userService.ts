import { base_url } from "../config/url";
import { useLocalStorage } from "../localStorage/storage";

export interface UserCommonData {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
}

const getUserCommonData = async (userId: string): Promise<UserCommonData> => {
  if (userId.length == 0 || userId.includes(" ")) {
    throw new Error("Invalid user id!");
  }
  const requestUrl = `${base_url}/api/user/${userId}`;

  try {
    const res = await fetch(requestUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = (await res.json()) as UserCommonData;

    return data;
  } catch (error) {
    console.log((error as Error).stack);
    return { id: "undefined", firstName: "Null", lastName: "Null" };
  }
};

interface UserCredentials {
  readonly username: string;
  readonly password: string;
}

const userLogin = async (credentials: UserCredentials): Promise<{ message: string; status: boolean; error?: boolean }> => {
  const [token, saveToken] = useLocalStorage<string>("token", "");

  const requestUrl = `${base_url}/api/auth/login`;

  const body = credentials;

  try {
    const res = await fetch(requestUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const prasedJSON = await res.json();

    if (prasedJSON.token) {
      saveToken(token);
    } else {
      return { message: "Login failed: User logged in", status: false };
    }

    return { message: "Success", status: true };
  } catch (error) {
    return { message: (error as Error).stack ?? "", status: false, error: true };
  }
};

export { getUserCommonData, userLogin };
