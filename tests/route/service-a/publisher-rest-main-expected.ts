
export const PublisherRESTMainExpected = {
  name: "service-a",
  summary: {
    "components": 6,
    "publishs": 6
  },
  components: [
    "SERVICE-C::R1",
    "SERVICE-C::R2",
    "SERVICE-C::R3",
    "SERVICE-B::R1",
    "SERVICE-B::R2",
    "SERVICE-B::R3"
  ],
  publishs: [
    "SERVICE-A::R1 --> service-c",
    "SERVICE-A::R2 --> service-c",
    "SERVICE-A::R3 --> service-c",
    "SERVICE-A::R1 --> service-b",
    "SERVICE-A::R2 --> service-b",
    "SERVICE-A::R3 --> service-b"
  ],
  discovers: [],
  endpoints: [
    {
      "name": "service-b",
      "host": "localhost",
      "port": 3002,
      "route": "/v1/publish"
    },
    {
      "name": "service-c",
      "host": "localhost",
      "port": 3003,
      "route": "/v1/publish"
    }
  ]
}
