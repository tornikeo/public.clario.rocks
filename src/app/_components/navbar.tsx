import Link from "next/link";
import { auth } from "~/server/auth";
import { RefreshButton } from "./refreshbutton"; // Import the Client Component

export async function Navbar() {
  const session = await auth();
  const user = session?.user;

  return (
    <nav className="flex flex-col items-center justify-between p-4 border-b">
      <div className="flex items-center justify-between w-full">
        <Link href="/" className="flex items-center font-bold text-lg px-2">
          <img src="/favicon.ico" alt="Clario Logo" className="w-6 h-6 mr-2" />
          Clario
        </Link>

        <div className="flex flex-row">
          <RefreshButton />
          <div>
            {user ? (
              <>
                <span className="mr-4 px-2">Hello, {user.name ?? "User"}!</span>
                <Link href="/api/auth/signout" className="hover:underline mr-4">
                  Sign out
                </Link>
              </>
            ) : (
              <Link href="/api/auth/signin" className="hover:underline mr-4 px-2">
                Sign in
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}