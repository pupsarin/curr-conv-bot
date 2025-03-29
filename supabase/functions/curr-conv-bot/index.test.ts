import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { regex } from "./constants.ts";

Deno.test("should match basic currency format", () => {
  const message = "20 EUR";
  const matches = message.match(regex);
  assertExists(matches, "Should find matches");
  assertEquals(matches![0], "20 EUR");
});

Deno.test("should match currency without space", () => {
  const message = "20EUR";
  const matches = message.match(regex);
  assertExists(matches, "Should find matches");
  assertEquals(matches![0], "20EUR");
});

Deno.test("should match currency in sentence", () => {
  const message = "I bought 10 figs for 20 eur";
  const matches = message.match(regex);
  assertExists(matches, "Should find matches");
  assertEquals(matches![0], "20 eur");
});

Deno.test("should match Cyrillic currency", () => {
  const message = "20 грн";
  const matches = message.match(regex);
  assertExists(matches, "Should find matches");
  assertEquals(matches![0], "20 грн");
});

Deno.test("should find first valid currency match", () => {
  const message = "4600g за 120cad";
  const matches = message.match(regex);
  assertExists(matches, "Should find matches");
  
  assertEquals(matches!.length, 1);
  assertEquals(matches![0], "120cad");
  
  let processedMatch: string | null = null;
  for (const match of matches!) {
    const currency = match.replace(/[0-9.\s]/g, '').toUpperCase();
    
    if (currency === "CAD" || currency === "КАД") {
      processedMatch = match;
      break;
    }
  }
  
  assertExists(processedMatch, "Should process the first valid match");
  assertEquals(processedMatch, "120cad");
});

Deno.test("should not match partial currency codes", () => {
  const message = "100grams 120cad";
  const matches = message.match(regex);
  assertExists(matches, "Should find matches");
  
  assertEquals(matches!.length, 1);
  assertEquals(matches![0], "120cad");
});

Deno.test("should match currency variations", () => {
  const testCases = [
    { message: "20 гривен", expected: "20 гривен" },
    { message: "20 долларів", expected: "20 доллар" },
    { message: "20 доларів", expected: "20 долар" },
    { message: "20 евра", expected: "20 евра" },
    { message: "20 крон", expected: "20 крон" },
    { message: "20 левів", expected: "20 лев" }
  ];

  for (const { message, expected } of testCases) {
    const matches = message.match(regex);
    assertExists(matches, `Should find matches for ${message}`);
    assertEquals(matches![0], expected);
  }
});
