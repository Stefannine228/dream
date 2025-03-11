import Image from "next/image";
import styles from "./page.module.css";
import Link from "next/link";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
      <h1>Next</h1>
      <Link href="/pages/about">map</Link>
      </main>
    </div>
  );
}
