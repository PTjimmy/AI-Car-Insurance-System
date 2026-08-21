import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

import {
  claims as initialClaims,
  type Claim,
  type ClaimStatus,
} from "../data/claims";

type ClaimsContextType = {
  claims: Claim[];
  updateClaimStatus: (
    claimNumber: string,
    status: ClaimStatus
  ) => void;
};

const ClaimsContext = createContext<ClaimsContextType | undefined>(
  undefined
);

export function ClaimsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [claims, setClaims] = useState<Claim[]>(initialClaims);

  const updateClaimStatus = (
    claimNumber: string,
    status: ClaimStatus
  ) => {
    setClaims((currentClaims) =>
      currentClaims.map((claim) =>
        claim.number === claimNumber
          ? { ...claim, status }
          : claim
      )
    );
  };

  return (
    <ClaimsContext.Provider
      value={{
        claims,
        updateClaimStatus,
      }}
    >
      {children}
    </ClaimsContext.Provider>
  );
}

export function useClaims() {
  const context = useContext(ClaimsContext);

  if (!context) {
    throw new Error(
      "useClaims must be used inside ClaimsProvider"
    );
  }

  return context;
}