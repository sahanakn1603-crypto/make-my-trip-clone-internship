import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Head from "next/head";
import store, { setUser } from "@/store";
import { Provider } from "react-redux";
import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";
import Footer from "@/components/Fotter";

const Myapp = ({ Component, pageProps }: AppProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    try {
      const storeduser = localStorage.getItem("user");

      if (storeduser) {
        store.dispatch(setUser(JSON.parse(storeduser)));
      }
    } catch (error) {
      console.error("Error restoring user:", error);
    }
  }, []);

  /*
   * Do not render Navbar, Footer, Redux-dependent UI, or the page
   * until the browser has mounted.
   *
   * This guarantees that the server HTML and the first client HTML
   * are identical and prevents hydration mismatches caused by
   * localStorage/Redux/browser-only state.
   */
  if (!mounted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-600 text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <Component {...pageProps} />
      <Footer />
    </div>
  );
};

export default function App(props: AppProps) {
  return (
    <Provider store={store}>
      <Head>
        <title>MakeMyTour</title>
      </Head>
      <Myapp {...props} />
    </Provider>
  );
}
