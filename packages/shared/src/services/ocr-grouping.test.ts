import { describe, expect, it } from "vitest";
import { groupLinesIntoBlocks } from "./ocr-grouping.js";

// Toạ độ thật lấy từ kết quả OCR.space trên 1 trang truyện thật (2 bong bóng thoại
// cạnh nhau, xen kẽ theo bboxY nên không thể chỉ sort đơn giản).
const REAL_PAGE_LINES = [
  { text: "TRONG HỌC VIÊN", bboxX: 708, bboxY: 14, bboxWidth: 156, bboxHeight: 22 },
  { text: "PHÁP THUẬT", bboxX: 726, bboxY: 40, bboxWidth: 122, bboxHeight: 35 },
  { text: "DANH GIÁ NÀY", bboxX: 718, bboxY: 72, bboxWidth: 138, bboxHeight: 22 },
  { text: "ĐƯƠNG", bboxX: 172, bboxY: 82, bboxWidth: 70, bboxHeight: 27 },
  { text: "BẠN NGHĨ ĐIỀU GÌ", bboxX: 702, bboxY: 98, bboxWidth: 170, bboxHeight: 26 },
  { text: "NHIÊN, ĐÓ", bboxX: 156, bboxY: 112, bboxWidth: 98, bboxHeight: 28 },
  { text: "LÀ QUAN TRỌNG", bboxX: 708, bboxY: 130, bboxWidth: 154, bboxHeight: 24 },
  { text: "LÀ TÀI", bboxX: 174, bboxY: 140, bboxWidth: 66, bboxHeight: 24 },
  { text: "NHẤT?", bboxX: 754, bboxY: 154, bboxWidth: 64, bboxHeight: 26 },
  { text: "NĂNG VỀ", bboxX: 162, bboxY: 167, bboxWidth: 88, bboxHeight: 28 },
  { text: "PHÁP", bboxX: 178, bboxY: 198, bboxWidth: 56, bboxHeight: 24 },
  { text: "THUẬT", bboxX: 174, bboxY: 227, bboxWidth: 65, bboxHeight: 28 },
];

describe("groupLinesIntoBlocks", () => {
  it("groups word-wrapped OCR lines into one block per speech bubble, ignoring interleaving from a neighboring bubble", () => {
    const blocks = groupLinesIntoBlocks(REAL_PAGE_LINES);

    expect(blocks).toHaveLength(2);
    expect(blocks[0].text).toBe("TRONG HỌC VIÊN PHÁP THUẬT DANH GIÁ NÀY BẠN NGHĨ ĐIỀU GÌ LÀ QUAN TRỌNG NHẤT?");
    expect(blocks[1].text).toBe("ĐƯƠNG NHIÊN, ĐÓ LÀ TÀI NĂNG VỀ PHÁP THUẬT");
  });

  it("keeps far-apart lines as separate blocks", () => {
    const blocks = groupLinesIntoBlocks([
      { text: "Bubble one", bboxX: 10, bboxY: 10, bboxWidth: 100, bboxHeight: 20 },
      { text: "far below", bboxX: 10, bboxY: 500, bboxWidth: 100, bboxHeight: 20 },
    ]);

    expect(blocks).toHaveLength(2);
  });
});
