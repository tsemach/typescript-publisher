
export const PublisherRESTMainExpected = {
  name: "service-c",
  summary: {
    components: 6,
    publishs: 6
  },
  components: [
    "SERVICE-B::R1",
    "SERVICE-B::R2",
    "SERVICE-B::R3",
    "SERVICE-A::R1",
    "SERVICE-A::R2",
    "SERVICE-A::R3"
  ],
  publishs: [
    "SERVICE-C::R1 --> service-b",
    "SERVICE-C::R3 --> service-b",
    "SERVICE-C::R2 --> service-b",
    "SERVICE-C::R1 --> service-a",
    "SERVICE-C::R2 --> service-a",
    "SERVICE-C::R3 --> service-a"
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
      "name": "service-b",
      "host": "localhost",
      "port": 3002,
      "route": "/v1/publish"
    }
  ]
}
