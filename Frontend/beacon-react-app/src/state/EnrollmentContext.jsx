import { createContext, useContext, useEffect, useMemo, useState } from "react";

const EnrollmentCtx = createContext(null);
const LS_KEY = "beacon_enrolled_courses_v1";

export function EnrollmentProvider({ children }) {
  const [enrolledIds, setEnrolledIds] = useState([]);

  const enroll = (id) =>
    setEnrolledIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  const unenroll = (id) =>
    setEnrolledIds((prev) => prev.filter((x) => x !== id));
  const isEnrolled = (id) => enrolledIds.includes(id);

  const value = useMemo(
    () => ({ enrolledIds, enroll, unenroll, isEnrolled }),
    [enrolledIds]
  );
  return (
    <EnrollmentCtx.Provider value={value}>{children}</EnrollmentCtx.Provider>
  );
}

export const useEnrollment = () => useContext(EnrollmentCtx);
