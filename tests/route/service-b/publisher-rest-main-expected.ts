
export const PublisherRESTMainExpected = {
  name: "service-b",
  summary: {
    "components": 6,
    "publishs": 6
  },
  components: [
    "SERVICE-C::R1",
    "SERVICE-C::R2",
    "SERVICE-C::R3",
    "SERVICE-A::R1",
    "SERVICE-A::R2",
    "SERVICE-A::R3"
  ],
  publishs: [
    "SERVICE-B::R1 --> service-a",
    "SERVICE-B::R1 --> service-c",
    "SERVICE-B::R2 --> service-c",
    "SERVICE-B::R3 --> service-c",
    "SERVICE-B::R2 --> service-a",
    "SERVICE-B::R3 --> service-a"
  ],
  discovers: [],
  endpoints: [
    {
      "name": "service-a",
      "host": "localhost",
      "port": 3001,
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
