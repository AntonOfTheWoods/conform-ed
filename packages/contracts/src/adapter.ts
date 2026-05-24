export type AdapterCapability = {
  contractVersion: string;
  adapterName: string;
  adapterVersion: string;
  profiles: string[];
  operations: string[];
};

export type AdapterError = {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
};
